import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
export default function Home() {
  return (
    <main id="main-content" className="landing">
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-tag">
            <span className="live-dot" /> BUILT ON SOLANA · TEST-NETWORK RELEASE
          </span>
          <h1>
            A good deal
            <br />
            starts with
            <br />
            <em>a little trust.</em>
          </h1>
          <p>
            Agree on the details. Secure the payment. Release when it’s right. A
            simpler way to trade with confidence—with your wallet in control.
          </p>
          <div className="button-row">
            <Link className="btn primary large" href="/app">
              Enter your workspace <ArrowUpRight size={19} />
            </Link>
            <Link className="text-link" href="/how-it-works">
              See how it works ↗
            </Link>
          </div>
          <div className="hero-assurances">
            <span>
              <Check size={15} />
              Wallet-signed
            </span>
            <span>
              <Check size={15} />
              Transparent fees
            </span>
            <span>
              <Check size={15} />
              On-chain settlement
            </span>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Escrow flow illustration, not live transaction data"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-spark spark-one">✦</span>
          <span className="art-spark spark-two">✦</span>
          <div className="floating-label label-one">
            <Fingerprint size={19} />
            <span>
              Your wallet.
              <br />
              <strong>Your signature.</strong>
            </span>
          </div>
          <div className="escrow-illustration">
            <div className="illustration-top">
              <span className="brand-mark">
                <ShieldCheck size={23} />
              </span>
              <span>THE SAFER WAY TO TRADE</span>
              <span className="live-dot" />
            </div>
            <div className="illustration-shield">
              <ShieldCheck size={69} strokeWidth={1.3} />
            </div>
            <h2>Protected by agreement.</h2>
            <p>USDC escrow on Solana</p>
            <div className="illustration-flow">
              <span>Agree</span>
              <i />
              <span>Secure</span>
              <i />
              <span>Release</span>
            </div>
            <div className="illustration-footer">
              <LockKeyhole size={14} />
              Funds follow the program’s rules
            </div>
          </div>
          <div className="floating-label label-two">
            <span className="token-icon">$</span>
            <span>
              Transparent payments.
              <br />
              <strong>No hidden platform fees.</strong>
            </span>
          </div>
          <p className="art-caption">
            An illustration of the escrow flow. Not a live transaction.
          </p>
        </div>
      </section>
      <section className="landing-bottom">
        <div>
          <span className="eyebrow">LESS GUESSWORK. MORE CONFIDENCE.</span>
          <h2>Built around both sides of the deal.</h2>
        </div>
        <p>
          A clear agreement protects the buyer and the seller. Review terms,
          track escrow state, and verify every payment on-chain. This release is
          unaudited and restricted to test networks.
        </p>
        <Link className="text-link" href="/risk-disclosure">
          Know the risks <ArrowUpRight size={16} />
        </Link>
      </section>
    </main>
  );
}
