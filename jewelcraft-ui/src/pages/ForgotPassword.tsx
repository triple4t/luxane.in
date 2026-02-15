import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [resetRequestToken, setResetRequestToken] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.forgotPassword(email);
      if ("requiresOtp" in response && response.requiresOtp) {
        setResetRequestToken(response.resetRequestToken);
        setOtpStep(true);
        setOtp("");
        toast({
          title: "Code sent",
          description: "Enter the verification code sent to your phone.",
        });
      } else {
        setIsSubmitted(true);
        toast({
          title: "Email sent",
          description: "If an account exists with this email, a reset link has been sent.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetRequestToken || otp.replace(/\D/g, "").length < 4) return;
    setIsVerifying(true);
    try {
      const data = await api.verifyResetOtp(resetRequestToken, otp);
      navigate("/reset-password", { state: { token: data.resetToken } });
      toast({
        title: "Verified",
        description: "Enter your new password.",
      });
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Layout>
      <div className="container py-16 sm:py-24">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-3">
              {otpStep ? "Verify your phone" : "Forgot Password"}
            </h1>
            <p className="text-muted-foreground">
              {otpStep
                ? "Enter the 6-digit code sent to your phone"
                : "Enter your email and we'll send a reset link or a code to your phone"}
            </p>
          </div>

          {isSubmitted && !otpStep ? (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  Check your email
                </p>
                <p className="text-green-700 dark:text-green-300 text-sm mt-2">
                  If an account exists with this email, a password reset link has been sent.
                </p>
              </div>
              <div className="text-center space-y-4">
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                  }}
                  className="w-full"
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : otpStep ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <Label>Verification code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={isVerifying}
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
                disabled={isVerifying || otp.replace(/\D/g, "").length < 4}
              >
                {isVerifying ? "Verifying..." : "Verify & continue"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={isVerifying}
                onClick={() => {
                  setOtpStep(false);
                  setResetRequestToken("");
                  setOtp("");
                }}
              >
                Back to email
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send reset link / code"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Remember your password? </span>
            <Link to="/login" className="text-foreground hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
