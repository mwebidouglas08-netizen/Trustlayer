-- TrustLayer: verified on-chain transaction synchronization.
-- Solana remains the source of truth.
-- Supabase stores authenticated history and a recoverable state mirror.

-- Original escrow creation signature.
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS creation_signature text;

-- Solana slot and transaction position within that slot.
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS last_event_slot bigint NOT NULL DEFAULT 0;

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS last_event_transaction_index integer NOT NULL DEFAULT -1;

-- One indexed history record per escrow per cluster.
CREATE UNIQUE INDEX IF NOT EXISTS transactions_cluster_escrow_pda_unique
ON public.transactions (cluster, escrow_pda)
WHERE escrow_pda IS NOT NULL;

-- Prevent duplicate creation signatures.
CREATE UNIQUE INDEX IF NOT EXISTS transactions_cluster_creation_signature_unique
ON public.transactions (cluster, creation_signature)
WHERE creation_signature IS NOT NULL;

-- Immutable record of verified on-chain actions.
CREATE TABLE IF NOT EXISTS public.transaction_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    transaction_id uuid NOT NULL
        REFERENCES public.transactions(id) ON DELETE RESTRICT,

    cluster text NOT NULL
        CHECK (cluster IN ('devnet', 'testnet', 'mainnet-beta')),

    signature text NOT NULL,

    action text NOT NULL
        CHECK (action IN (
            'create_escrow',
            'fund_escrow',
            'mark_delivery_submitted',
            'release_to_seller',
            'open_dispute',
            'resolve_dispute_refund_buyer',
            'resolve_dispute_pay_seller',
            'cancel_unfunded'
        )),

    actor_wallet text NOT NULL,
    actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    escrow_address text NOT NULL,

    resulting_state smallint NOT NULL
        CHECK (resulting_state BETWEEN 0 AND 7),

    slot bigint NOT NULL CHECK (slot >= 0),

    transaction_index integer NOT NULL
        CHECK (transaction_index >= 0),

    block_time timestamptz,

    instruction_index integer NOT NULL
        CHECK (instruction_index >= 0),

    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT transaction_events_cluster_signature_unique
        UNIQUE (cluster, signature)
);

CREATE INDEX IF NOT EXISTS transaction_events_transaction_created_idx
ON public.transaction_events (transaction_id, created_at DESC);

CREATE INDEX IF NOT EXISTS transaction_events_actor_user_idx
ON public.transaction_events (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS transaction_events_escrow_idx
ON public.transaction_events (cluster, escrow_address);

-- Browser clients can read participant history but cannot forge events.
ALTER TABLE public.transaction_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.transaction_events FROM anon, authenticated;

GRANT SELECT ON public.transaction_events TO authenticated;

CREATE POLICY transaction_events_select_participant
ON public.transaction_events
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.transactions t
        WHERE t.id = transaction_events.transaction_id
          AND (
              auth.uid() = t.creator_user_id
              OR auth.uid() = t.buyer_user_id
              OR auth.uid() = t.seller_user_id
          )
    )
);

-- Atomically update the history mirror only when the incoming event
-- is newer than the event currently represented by the transaction row.
CREATE OR REPLACE FUNCTION public.trustlayer_apply_event_mirror(
    p_transaction_id uuid,
    p_slot bigint,
    p_transaction_index integer,
    p_state text,
    p_funded_at timestamptz,
    p_completed_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    affected_rows integer;
BEGIN
    UPDATE public.transactions AS t
    SET
        state_mirror = p_state,
        last_event_slot = p_slot,
        last_event_transaction_index = p_transaction_index,
        funded_at = COALESCE(p_funded_at, t.funded_at),
        completed_at = COALESCE(p_completed_at, t.completed_at),
        updated_at = now()
    WHERE t.id = p_transaction_id
      AND (t.last_event_slot, t.last_event_transaction_index)
          < (p_slot, p_transaction_index);

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    RETURN affected_rows = 1;
END;
$function$;

-- Only the trusted server-side Edge Function may update the mirror.
REVOKE ALL ON FUNCTION public.trustlayer_apply_event_mirror(
    uuid, bigint, integer, text, timestamptz, timestamptz
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.trustlayer_apply_event_mirror(
    uuid, bigint, integer, text, timestamptz, timestamptz
) TO service_role;

-- No browser INSERT, UPDATE, or DELETE access to transaction events.
