import { Check, Sparkles, Zap, Shield } from "lucide-react";
import { useState } from "react";
import { User } from "../types";
import { PayPalButtons } from "@paypal/react-paypal-js";

interface PricingProps {
  user: User;
  onRefresh: () => void;
}

export default function Pricing({ user, onRefresh }: PricingProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePayPalSuccess = async (planId: string, orderId: string) => {
    try {
      const res = await fetch("/api/payments/paypal-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, orderId }),
      });
      if (res.ok) {
        setSuccess(planId);
        onRefresh();
      }
    } catch (error) {
      console.error("PayPal success handling failed", error);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Starter',
      price: '0',
      description: 'Perfect for exploring AI content creation.',
      features: [
        '5 AI Thumbnails / month',
        'Basic Video Scripts',
        'Standard Image Generation',
        'Community Support'
      ],
      buttonText: user.subscription_status === 'free' ? 'Current Plan' : 'Downgrade',
      disabled: user.subscription_status === 'free',
      icon: Zap
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '29',
      description: 'For serious creators who need more power.',
      features: [
        'Unlimited AI Thumbnails',
        'Advanced Video Scripts',
        '4K Pro Image Generation',
        'AI Voiceovers (TTS)',
        'Priority Support'
      ],
      buttonText: user.subscription_status === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      disabled: user.subscription_status === 'pro',
      icon: Sparkles,
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '99',
      description: 'Custom solutions for agencies and teams.',
      features: [
        'Everything in Pro',
        'Custom AI Model Training',
        'API Access',
        'Dedicated Account Manager',
        'Team Collaboration Tools'
      ],
      buttonText: user.subscription_status === 'enterprise' ? 'Current Plan' : 'Contact Sales',
      disabled: user.subscription_status === 'enterprise',
      icon: Shield
    }
  ];

  return (
    <div className="space-y-12 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-text-heading tracking-tight">Choose Your Plan</h1>
        <p className="text-text-body text-lg max-w-2xl mx-auto">
          Unlock the full potential of AI-powered content creation. Scale your production and dominate every platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`glass-card p-8 rounded-[2.5rem] flex flex-col relative overflow-hidden transition-all duration-500 hover:scale-[1.02] ${
              plan.popular ? 'border-primary shadow-[0_0_40px_rgba(168,85,247,0.1)]' : 'border-white/5'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-primary text-white px-6 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                plan.popular ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-body'
              }`}>
                <plan.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-text-heading mb-2">{plan.name}</h3>
              <p className="text-sm text-text-body/60 leading-relaxed">{plan.description}</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-text-heading">${plan.price}</span>
                <span className="text-text-body/40 font-medium">/month</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-10">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    plan.popular ? 'bg-primary/20 text-primary' : 'bg-white/10 text-text-body/40'
                  }`}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-sm text-text-body/80">{feature}</span>
                </div>
              ))}
            </div>

            {plan.id === 'free' ? (
              <button
                disabled={plan.disabled}
                className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                  plan.popular 
                    ? 'bg-primary text-white neon-glow hover:bg-primary/90' 
                    : 'bg-white/5 text-text-heading hover:bg-white/10 border border-white/10'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {plan.buttonText}
              </button>
            ) : success === plan.id ? (
              <div className="w-full py-4 rounded-2xl bg-green-500/20 text-green-400 font-bold flex items-center justify-center gap-2 border border-green-500/30">
                <Check className="w-5 h-5" />
                Plan Activated!
              </div>
            ) : user.subscription_status === plan.id ? (
              <div className="w-full py-4 rounded-2xl bg-primary/20 text-primary font-bold flex items-center justify-center gap-2 border border-primary/30">
                Current Plan
              </div>
            ) : (
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
                            value: plan.price,
                          },
                          description: `CreatorForge ${plan.name} Plan`,
                        },
                      ],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    if (actions.order) {
                      const order = await actions.order.capture();
                      await handlePayPalSuccess(plan.id, order.id);
                    }
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="glass-card p-8 rounded-3xl border-white/5 text-center">
        <p className="text-text-body/60 text-sm">
          All plans include a 14-day money-back guarantee. No questions asked.
          <br />
          Need a custom plan? <button className="text-primary font-bold hover:underline">Talk to our team</button>
        </p>
      </div>
    </div>
  );
}
