"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  KeyRound,
  Send,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { VisitorFormSteps } from "@/components/visitor-form-steps";
import { PhotoCapture } from "@/components/photo-capture";

// ---------- Types ----------
interface NewVisitorForm {
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  mobile: string;
  purposeOfVisit: string;
  companyToVisit: string;
  personToVisit: string;
  visitorTagNumber: string;
  idProofType: string;
  idProofNumber: string;
  hasGadget: boolean;
  gadgetType: string;
  gadgetBrand: string;
  gadgetSerial: string;
}

interface ExistingVisitorVisit {
  purposeOfVisit: string;
  companyToVisit: string;
  personToVisit: string;
  hasGadget: boolean;
  gadgetType: string;
  gadgetBrand: string;
  gadgetSerial: string;
}

const FORM_STEPS = ["Basic Details", "Visit Details", "ID Proof & Photo", "Your Photo & Gadgets"];

const TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Dr"];
const ID_PROOF_OPTIONS = [
  "Aadhaar Card",
  "PAN Card",
];

// ---------- Helper: Field Wrapper ----------
function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ---------- Select Field (controlled via react-hook-form Controller) ----------
function SelectField({
  value,
  onChange,
  placeholder,
  options,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  options: string[];
  className?: string;
}) {
  return (
    <Select value={value ?? ""} onValueChange={(val) => { if (val !== null) onChange(val); }}>
      <SelectTrigger className={cn("h-12 w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// =================================================================
// NEW VISITOR FORM
// =================================================================
function NewVisitorTab({ onSwitchTab }: { onSwitchTab: (tab: "existing") => void }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [idProofPhotoFile, setIdProofPhotoFile] = useState<File | null>(null);
  const [idProofPhotoPreview, setIdProofPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [existingVisitorName, setExistingVisitorName] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<NewVisitorForm>({
    defaultValues: {
      title: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      mobile: "",
      purposeOfVisit: "",
      companyToVisit: "",
      personToVisit: "",
      visitorTagNumber: "",
      idProofType: "",
      idProofNumber: "",
      hasGadget: false,
      gadgetType: "",
      gadgetBrand: "",
      gadgetSerial: "",
    },
  });

  const hasGadget = watch("hasGadget");
  const emailValue = watch("email");

  const sendRegistrationOtp = async () => {
    const emailValid = await trigger(["email"]);
    if (!emailValid) return;
    setIsSendingOtp(true);
    setEmailAlreadyExists(false);
    try {
      // Check if email already registered
      const checkRes = await fetch("/api/visitors/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setEmailAlreadyExists(true);
          setExistingVisitorName(
            `${checkData.visitor?.firstName || ""} ${checkData.visitor?.lastName || ""}`.trim()
          );
          return;
        }
      }

      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, allowUnregistered: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to send OTP");
      }
      setOtpSent(true);
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const [regOtpError, setRegOtpError] = useState("");

  const verifyRegistrationOtp = async () => {
    if (!otpValue || otpValue.length < 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setIsVerifyingOtp(true);
    setRegOtpError("");
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, code: otpValue, allowUnregistered: true }),
      });
      if (!res.ok) {
        setRegOtpError(
          res.status === 401
            ? "Invalid or expired OTP. Please check the code or request a new one."
            : "Verification failed. Please try again."
        );
        return;
      }
      setEmailVerified(true);
      toast.success("Email verified!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handlePhotoCapture = useCallback((file: File) => {
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }, []);

  const handleIdProofPhotoCapture = useCallback((file: File) => {
    setIdProofPhotoFile(file);
    const url = URL.createObjectURL(file);
    setIdProofPhotoPreview(url);
  }, []);

  const stepFields: Record<number, (keyof NewVisitorForm)[]> = {
    1: ["firstName", "lastName", "email", "mobile"],
    2: ["purposeOfVisit", "companyToVisit", "personToVisit"],
    3: ["idProofType"],
    4: [],
  };

  const nextStep = async () => {
    const valid = await trigger(stepFields[currentStep]);
    if (!valid) return;
    if (currentStep === 1 && !emailVerified) {
      toast.error("Please verify your email before proceeding");
      return;
    }
    if (currentStep === 3 && !idProofPhotoFile) {
      toast.error("Please capture or upload a photo of your ID proof");
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const onSubmit = async (data: NewVisitorForm) => {
    if (!photoFile) {
      toast.error("Please capture or upload your photo before submitting");
      return;
    }
    setIsSubmitting(true);
    try {
      // Upload person photo
      let photoUrl = "";
      const photoFormData = new FormData();
      photoFormData.append("photo", photoFile);
      const photoUploadRes = await fetch("/api/upload", {
        method: "POST",
        body: photoFormData,
      });
      if (!photoUploadRes.ok) throw new Error("Photo upload failed");
      const photoUploadData = await photoUploadRes.json();
      photoUrl = photoUploadData.url;

      // Upload ID proof photo
      let idProofPhotoUrl = "";
      if (idProofPhotoFile) {
        const idFormData = new FormData();
        idFormData.append("photo", idProofPhotoFile);
        const idUploadRes = await fetch("/api/upload", {
          method: "POST",
          body: idFormData,
        });
        if (!idUploadRes.ok) throw new Error("ID proof photo upload failed");
        const idUploadData = await idUploadRes.json();
        idProofPhotoUrl = idUploadData.url;
      }

      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, photoUrl, idProofPhotoUrl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Registration failed");
      }

      toast.success("Registration completed successfully!");
      router.push(
        `/visit/success?name=${encodeURIComponent(data.firstName + " " + data.lastName)}`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <VisitorFormSteps currentStep={currentStep} steps={FORM_STEPS} />

      {/* Step 1: Basic Details */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Title">
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select title"
                    options={TITLE_OPTIONS}
                  />
                )}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              label="First Name"
              required
              error={errors.firstName?.message}
            >
              <Input
                className="h-12"
                placeholder="First name"
                {...register("firstName", {
                  required: "First name is required",
                })}
              />
            </FormField>
            <FormField label="Middle Name">
              <Input
                className="h-12"
                placeholder="Middle name"
                {...register("middleName")}
              />
            </FormField>
            <FormField
              label="Last Name"
              required
              error={errors.lastName?.message}
            >
              <Input
                className="h-12"
                placeholder="Last name"
                {...register("lastName", {
                  required: "Last name is required",
                })}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Email" required error={errors.email?.message}>
              <div className="flex gap-2">
                <Input
                  className="h-12 flex-1"
                  type="email"
                  placeholder="you@example.com"
                  disabled={emailVerified || otpSent}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Please enter a valid email",
                    },
                    onChange: () => {
                      setEmailAlreadyExists(false);
                      setExistingVisitorName("");
                    },
                  })}
                />
                {!emailVerified && !otpSent && (
                  <Button
                    type="button"
                    className="h-12 gap-2 px-4"
                    onClick={sendRegistrationOtp}
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send OTP
                  </Button>
                )}
                {emailVerified && (
                  <span className="flex h-12 items-center rounded-md bg-green-100 px-3 text-sm font-medium text-green-700">
                    Verified
                  </span>
                )}
              </div>
            </FormField>
            <FormField
              label="Mobile Number"
              required
              error={errors.mobile?.message}
            >
              <Input
                className="h-12"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                {...register("mobile", {
                  required: "Mobile number is required",
                })}
              />
            </FormField>
          </div>
          {emailAlreadyExists && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                This email is already registered{existingVisitorName ? ` (${existingVisitorName})` : ""}.
              </p>
              <p className="mt-1 text-sm text-amber-700">
                You don&apos;t need to register again. Use the Existing User tab to quickly check in.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 border-amber-400 text-amber-800 hover:bg-amber-100"
                onClick={() => onSwitchTab("existing")}
              >
                Go to Existing User Check-In
              </Button>
            </div>
          )}
          {otpSent && !emailVerified && (
            <div className="space-y-2">
              <FormField label="Enter OTP">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-12 pl-10 text-center tracking-[0.5em] text-lg font-mono"
                      placeholder="000000"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) =>
                        setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    className="h-12 gap-2 px-6"
                    onClick={verifyRegistrationOtp}
                    disabled={isVerifyingOtp}
                  >
                    {isVerifyingOtp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
              </FormField>
              {regOtpError ? (
                <p className="text-xs text-destructive">{regOtpError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Check your email for the 6-digit code
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => {
                  setOtpSent(false);
                  setOtpValue("");
                  setRegOtpError("");
                }}
              >
                Resend OTP
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Visit Details */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Purpose of Visit"
              required
              error={errors.purposeOfVisit?.message}
            >
              <Input
                className="h-12"
                placeholder="e.g. Meeting, Interview, Delivery"
                {...register("purposeOfVisit", {
                  required: "Purpose of visit is required",
                })}
              />
            </FormField>
            <FormField
              label="Company to Visit"
              required
              error={errors.companyToVisit?.message}
            >
              <Input
                className="h-12"
                placeholder="Company name"
                {...register("companyToVisit", {
                  required: "Company is required",
                })}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Person to Visit"
              required
              error={errors.personToVisit?.message}
            >
              <Input
                className="h-12"
                placeholder="Person's name"
                {...register("personToVisit", {
                  required: "Person to visit is required",
                })}
              />
            </FormField>
            <FormField label="Visitor Tag Number">
              <Input
                className="h-12"
                placeholder="Tag number (if provided)"
                {...register("visitorTagNumber")}
              />
            </FormField>
          </div>
        </div>
      )}

      {/* Step 3: ID Proof & Photo */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="ID Proof Type" required error={errors.idProofType?.message}>
              <Controller
                name="idProofType"
                control={control}
                rules={{ required: "ID proof type is required" }}
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select ID type"
                    options={ID_PROOF_OPTIONS}
                  />
                )}
              />
            </FormField>
            <FormField label="ID Proof Number">
              <Input
                className="h-12"
                placeholder="Enter ID number"
                {...register("idProofNumber")}
              />
            </FormField>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium">
              ID Proof Photo <span className="ml-0.5 text-destructive">*</span>
            </Label>
            <p className="mb-3 text-xs text-muted-foreground">
              Take a photo or upload an image of your ID proof document
            </p>
            <PhotoCapture
              onPhotoCapture={handleIdProofPhotoCapture}
              currentPhoto={idProofPhotoPreview}
            />
          </div>
        </div>
      )}

      {/* Step 4: Your Photo & Gadgets */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium">
              Your Photo <span className="ml-0.5 text-destructive">*</span>
            </Label>
            <p className="mb-3 text-xs text-muted-foreground">
              Take a photo of yourself for visitor identification
            </p>
            <PhotoCapture
              onPhotoCapture={handlePhotoCapture}
              currentPhoto={photoPreview}
              cameraOnly
            />
          </div>

          <Separator />

          <Controller
            name="hasGadget"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="h-5 w-5"
                />
                <Label className="text-sm font-medium">
                  Are you carrying a personal gadget?
                </Label>
              </div>
            )}
          />

          {hasGadget && (
            <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-3">
              <FormField label="Gadget Type">
                <Input
                  className="h-12"
                  placeholder="e.g. Laptop, Tablet"
                  {...register("gadgetType")}
                />
              </FormField>
              <FormField label="Brand / Model">
                <Input
                  className="h-12"
                  placeholder="e.g. Dell XPS 15"
                  {...register("gadgetBrand")}
                />
              </FormField>
              <FormField label="Serial Number">
                <Input
                  className="h-12"
                  placeholder="Serial number"
                  {...register("gadgetSerial")}
                />
              </FormField>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-2">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 gap-2 text-sm"
            onClick={prevStep}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
        )}
        {currentStep < 4 ? (
          <Button
            type="button"
            className="h-12 flex-1 gap-2 text-sm"
            onClick={nextStep}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            className="h-12 flex-1 gap-2 text-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Registration"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}

// =================================================================
// EXISTING USER TAB
// =================================================================
function ExistingUserTab({ onSwitchTab }: { onSwitchTab: (tab: "new") => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [visitorProfile, setVisitorProfile] = useState<Record<string, string> | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailNotFound, setEmailNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
  } = useForm<ExistingVisitorVisit>({
    defaultValues: {
      purposeOfVisit: "",
      companyToVisit: "",
      personToVisit: "",
      hasGadget: false,
      gadgetType: "",
      gadgetBrand: "",
      gadgetSerial: "",
    },
  });

  const hasGadget = watch("hasGadget");

  const sendOtp = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setIsSending(true);
    setEmailNotFound(false);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 404) {
          setEmailNotFound(true);
          return;
        }
        throw new Error(err.message || "Failed to send OTP");
      }
      setOtpSent(true);
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsSending(false);
    }
  };

  const [otpError, setOtpError] = useState("");

  const verifyOtp = async () => {
    if (!otp || otp.length < 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setIsVerifying(true);
    setOtpError("");
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message = err.error || "Invalid OTP";
        setOtpError(
          res.status === 401
            ? "Invalid or expired OTP. Please check the code or request a new one."
            : message
        );
        return;
      }
      const data = await res.json();
      setVisitorProfile(data.visitor || data);
      setVerified(true);
      toast.success("Email verified successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: ExistingVisitorVisit) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorProfileId: visitorProfile?.id,
          email,
          ...data,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Check-in failed");
      }
      toast.success("Check-in completed!");
      const name =
        visitorProfile?.firstName && visitorProfile?.lastName
          ? `${visitorProfile.firstName} ${visitorProfile.lastName}`
          : "Visitor";
      router.push(`/visit/success?name=${encodeURIComponent(name)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not verified yet: show email + OTP flow
  if (!verified) {
    return (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-12 pl-10"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={otpSent}
              />
            </div>
            <Button
              type="button"
              className="h-12 gap-2 px-6"
              onClick={sendOtp}
              disabled={isSending || otpSent}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {otpSent ? "Sent" : "Send OTP"}
            </Button>
          </div>
        </div>

        {emailNotFound && (
          <div className="rounded-lg border border-blue-300 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800">
              No account found for this email.
            </p>
            <p className="mt-1 text-sm text-blue-700">
              It looks like you haven&apos;t visited before. Please register as a first-time visitor.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 border-blue-400 text-blue-800 hover:bg-blue-100"
              onClick={() => onSwitchTab("new")}
            >
              Go to First Time Registration
            </Button>
          </div>
        )}

        {otpSent && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Enter OTP <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-12 pl-10 text-center tracking-[0.5em] text-lg font-mono"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />
                </div>
                <Button
                  type="button"
                  className="h-12 gap-2 px-6"
                  onClick={verifyOtp}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
              {otpError ? (
                <p className="text-xs text-destructive">{otpError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Check your email for the 6-digit code
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                className="h-10 text-sm"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setOtpError("");
                  setEmailNotFound(false);
                }}
              >
                Use a different email
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10 text-sm"
                onClick={() => {
                  setOtp("");
                  setOtpError("");
                  setOtpSent(false);
                  sendOtp();
                }}
              >
                Resend OTP
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Verified: show pre-filled info + visit form
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {visitorProfile && (
        <Card className="bg-muted/30">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                {(visitorProfile.firstName?.[0] || "").toUpperCase()}
                {(visitorProfile.lastName?.[0] || "").toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">
                  {visitorProfile.firstName} {visitorProfile.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Purpose of Visit" required>
          <Input
            className="h-12"
            placeholder="e.g. Meeting, Interview, Delivery"
            {...register("purposeOfVisit", {
              required: "Purpose of visit is required",
            })}
          />
        </FormField>
        <FormField label="Company to Visit" required>
          <Input
            className="h-12"
            placeholder="Company name"
            {...register("companyToVisit", {
              required: "Company is required",
            })}
          />
        </FormField>
      </div>

      <FormField label="Person to Visit" required>
        <Input
          className="h-12"
          placeholder="Person's name"
          {...register("personToVisit", {
            required: "Person to visit is required",
          })}
        />
      </FormField>

      <Separator />

      <Controller
        name="hasGadget"
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-3">
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              className="h-5 w-5"
            />
            <Label className="text-sm font-medium">
              Are you carrying a personal gadget?
            </Label>
          </div>
        )}
      />

      {hasGadget && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-3">
          <FormField label="Gadget Type">
            <Input
              className="h-12"
              placeholder="e.g. Laptop, Tablet"
              {...register("gadgetType")}
            />
          </FormField>
          <FormField label="Brand / Model">
            <Input
              className="h-12"
              placeholder="e.g. Dell XPS 15"
              {...register("gadgetBrand")}
            />
          </FormField>
          <FormField label="Serial Number">
            <Input
              className="h-12"
              placeholder="Serial number"
              {...register("gadgetSerial")}
            />
          </FormField>
        </div>
      )}

      <Button
        type="submit"
        className="h-12 w-full gap-2 text-sm"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Check In"
        )}
      </Button>
    </form>
  );
}

// =================================================================
// MAIN PAGE
// =================================================================
export default function VisitPage() {
  const [activeTab, setActiveTab] = useState<"new" | "existing">("new");

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4">
            <Image src="/MSBDOCS-Logo-new.svg" alt="MSB Docs" width={180} height={30} style={{ height: 'auto' }} className="mx-auto" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Visitor Registration
          </h1>
          <p className="mt-2 text-muted-foreground">
            Welcome! Please select an option to continue.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-xl bg-muted p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("new")}
              className={cn(
                "rounded-lg px-6 py-2.5 text-sm font-medium transition-all",
                activeTab === "new"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              First Time Visitor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("existing")}
              className={cn(
                "rounded-lg px-6 py-2.5 text-sm font-medium transition-all",
                activeTab === "existing"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Existing User
            </button>
          </div>
        </div>

        {/* Content Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {activeTab === "new"
                ? "New Visitor Registration"
                : "Returning Visitor Check-In"}
            </CardTitle>
            <CardDescription>
              {activeTab === "new"
                ? "Please fill in the details below to register for your visit."
                : "Verify your identity to quickly check in for your visit."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeTab === "new" ? (
              <NewVisitorTab onSwitchTab={() => setActiveTab("existing")} />
            ) : (
              <ExistingUserTab onSwitchTab={() => setActiveTab("new")} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
