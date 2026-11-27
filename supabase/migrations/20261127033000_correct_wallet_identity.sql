-- TRUSTLAYER: separate wallet identity from Solana network context.
-- Wallet signatures prove key ownership, not cluster membership.

BEGIN;

-- Cluster is optional metadata, not a requirement for wallet verification.
ALTER TABLE public.wallets
  ALTER COLUMN cluster DROP NOT NULL;

ALTER TABLE public.wallets
  DROP CONSTRAINT wallets_cluster_check;

-- Global public-key uniqueness is already enforced by
-- wallets_unique_identity. The cluster-scoped constraint is redundant.
ALTER TABLE public.wallets
  DROP CONSTRAINT wallets_cluster_public_key_key;

-- A user has at most one primary wallet, regardless of network.
DROP INDEX public.wallets_one_primary;

CREATE UNIQUE INDEX wallets_one_primary
  ON public.wallets(user_id)
  WHERE is_primary;

COMMENT ON COLUMN public.wallets.cluster IS
  'Optional Solana network context. Wallet ownership verification does not establish cluster membership.';

-- Consume a valid, single-use wallet challenge and record ownership.
-- Do not assign a cluster during wallet verification.
CREATE OR REPLACE FUNCTION public.complete_wallet_challenge(
  p_id uuid,
  p_user uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  c public.wallet_challenges;
BEGIN
  SELECT *
  INTO c
  FROM public.wallet_challenges
  WHERE id = p_id
    AND user_id = p_user
    AND consumed_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF c.id IS NULL THEN
    RAISE EXCEPTION 'Expired or already used challenge';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user
      AND account_status = 'active'
  ) THEN
    RAISE EXCEPTION 'Account unavailable';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(c.public_key, 2)
  );

  IF EXISTS (
    SELECT 1
    FROM public.wallets
    WHERE public_key = c.public_key
      AND user_id <> p_user
  ) THEN
    RAISE EXCEPTION 'Wallet already linked to a different account';
  END IF;

  INSERT INTO public.wallets (
    user_id,
    public_key,
    cluster,
    verified_at,
    verification_method
  )
  VALUES (
    p_user,
    c.public_key,
    NULL,
    now(),
    'ed25519_challenge'
  )
  ON CONFLICT (public_key)
  DO UPDATE SET
    verified_at = EXCLUDED.verified_at,
    verification_method = EXCLUDED.verification_method
  WHERE public.wallets.user_id = EXCLUDED.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet is unavailable';
  END IF;

  UPDATE public.wallet_challenges
  SET consumed_at = now()
  WHERE id = p_id;

  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    resource_type,
    resource_id
  )
  VALUES (
    p_user,
    'user',
    'wallet_verified',
    'wallet',
    c.public_key
  );
END;
$function$;

COMMIT;
