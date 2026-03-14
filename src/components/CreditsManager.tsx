import { useState, useEffect } from "react";
import { Coins, Share2, Copy, Check, Gift, Zap, TrendingUp, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";
import { cn } from "../lib/utils";
import { PayPalButtons } from "@paypal/react-paypal-js";

import { db } from "../firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

interface CreditsManagerProps {
  user: User | null;
  onCreditsUpdate: (credits: number) => void;
}

export default function CreditsManager({ user, onCreditsUpdate }: CreditsManagerProps) {
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.referral_code) {
      setReferralCode(user.referral_code);
    } else {
      fetchReferralCode();
    }
  }, [user]);

  const fetchReferralCode = async () => {
    try {
      const res = await fetch("/api/referral/invite", { method: "POST" });
      const data = await res.json();
      if (data.referralCode) setReferralCode(data.referralCode);
    } catch (err) {
      console.error("Failed to fetch referral code");
    }
  };

  const handleCopy = () => {
    const inviteLink = `${window.location.origin}/?ref=${referralCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const creditPackages = [
    { id: 'starter', name: 'Starter', credits: 50, price: 5, icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'pro', name: 'Pro', credits: 200, price: 15, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', popular: true },
    { id: 'whale', name: 'Whale', credits: 1000, price: 50, icon: Gift, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  const handleBuyCredits = async (pkg: typeof creditPackages[0]) => {
    // This is now handled by PayPalButtons
  };

  const handlePayPalSuccess = async (pkg: any, orderId: string) => {
    if (!user) return;
    
    try {
      // Update Firestore directly for real-time credit update
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.id.toString());
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error("User document does not exist!");
        }

        const currentCredits = userDoc.data().credits || 0;
        transaction.update(userRef, {
          credits: currentCredits + pkg.credits,
          updated_at: serverTimestamp()
        });
      });

      // Still call backend for logging/verification if needed
      await fetch("/api/payments/buy-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: pkg.price, credits: pkg.credits, orderId })
      });
      
      onCreditsUpdate(user.credits + pkg.credits);
    } catch (err) {
      console.error("Payment processing failed:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Credits Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Coins className="w-20 h-20 text-primary" />
          </div>
          <p className="text-sm font-bold text-text-body/60 uppercase tracking-widest mb-1">Available Credits</p>
          <h3 className="text-4xl font-black text-text-heading font-display">{user?.credits || 0}</h3>
          <p className="text-xs text-text-body/40 mt-2">Used for uploads and AI generation</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/5 md:col-span-2 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-text-heading">Invite Friends, Get Credits</h4>
              <p className="text-sm text-text-body/60">Get 20 free credits for every friend who joins using your link.</p>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-text-body/80 flex items-center truncate">
              {window.location.origin}/?ref={referralCode}
            </div>
            <button
              onClick={handleCopy}
              className="px-6 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* Buy Credits */}
      <div>
        <h3 className="text-2xl font-bold text-text-heading mb-6 flex items-center gap-3">
          <Zap className="w-6 h-6 text-primary" />
          Refill Credits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creditPackages.map((pkg) => (
            <div 
              key={pkg.id}
              className={cn(
                "glass-card p-8 rounded-[2.5rem] border transition-all hover:translate-y-[-4px]",
                pkg.popular ? "border-primary/50 bg-primary/5" : "border-white/5 bg-white/5"
              )}
            >
              {pkg.popular && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg neon-glow">
                  Most Popular
                </span>
              )}
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", pkg.bg)}>
                <pkg.icon className={cn("w-7 h-7", pkg.color)} />
              </div>
              <h4 className="text-xl font-bold text-text-heading mb-1">{pkg.name}</h4>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-text-heading">{pkg.credits}</span>
                <span className="text-sm text-text-body/60 font-bold uppercase tracking-widest">Credits</span>
              </div>
              <div className="mb-8">
                <p className="text-4xl font-black text-text-heading font-display">${pkg.price}</p>
                <p className="text-xs text-text-body/40 font-bold uppercase tracking-widest mt-1">One-time payment</p>
              </div>
              <div className="relative z-10">
                <PayPalButtons
                  style={{ layout: "vertical", shape: "rect", label: "pay" }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [
                        {
                          amount: {
                            currency_code: "USD",
                            value: pkg.price.toString(),
                          },
                          description: `${pkg.credits} CreatorForge Credits`,
                        },
                      ],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    if (actions.order) {
                      const order = await actions.order.capture();
                      await handlePayPalSuccess(pkg, order.id);
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Stats (Mocked for now) */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-white/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-text-heading">Referral History</h4>
              <p className="text-sm text-text-body/60">See who joined using your link</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-text-body/40 uppercase tracking-widest">Total Earned</p>
            <p className="text-2xl font-black text-emerald-500">0 Credits</p>
          </div>
        </div>
        <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
          <p className="text-text-body/40 font-medium">No referrals yet. Start sharing your link!</p>
        </div>
      </div>
    </div>
  );
}
