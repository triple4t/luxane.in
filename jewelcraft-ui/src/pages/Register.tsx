import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const { register, sendSignupOtp } = useAuth();
  const navigate = useNavigate();

  const cleanPhone = phone.replace(/\D/g, "").slice(0, 10);
  const canSendOtp = cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone) && email && password.length >= 6 && name.trim().length > 0;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSendOtp) return;
    setIsSendingOtp(true);
    try {
      await sendSignupOtp(cleanPhone);
      toast({ title: "Code sent", description: "Check your phone for the verification code." });
      setOtpStep(true);
      setOtp("");
    } catch (error: any) {
      toast({
        title: "Could not send code",
        description: error.message || "Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || password.length < 6 || !name.trim() || cleanPhone.length !== 10 || otp.replace(/\D/g, "").length < 4) return;
    setIsLoading(true);
    try {
      await register({ email, password, name: name.trim(), phone: cleanPhone, code: otp });
      navigate("/");
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-16 sm:py-24">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-3">
              {otpStep ? "Verify your phone" : "Create Account"}
            </h1>
            <p className="text-muted-foreground">
              {otpStep
                ? "Enter the 6-digit code sent to your phone"
                : "Sign up with your details and verify your phone"}
            </p>
          </div>

          {!otpStep ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSendingOtp}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSendingOtp}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isSendingOtp}
                />
                <p className="text-xs text-muted-foreground">At least 6 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                  required
                  disabled={isSendingOtp}
                />
                <p className="text-xs text-muted-foreground">We’ll send a verification code to this number</p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSendingOtp || !canSendOtp}
              >
                {isSendingOtp ? "Sending code..." : "Send verification code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Verification code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={isLoading}
                  >
                    <InputOTPGroup className="gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || otp.replace(/\D/g, "").length < 4}
              >
                {isLoading ? "Creating account..." : "Verify & Create account"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={isLoading}
                onClick={() => setOtpStep(false)}
              >
                Back to details
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-foreground hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
