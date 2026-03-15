import { useState } from "react";
import { OtpInput } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function OtpInputDemo() {
  const [otp6, setOtp6] = useState("");
  const [otp4, setOtp4] = useState("");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">OtpInput</h1>

      <DemoSection title="6-Digit Code" description="Standard 6-digit verification input." code={`<OtpInput length={6} value={otp} onChange={setOtp} />`}>
        <OtpInput length={6} value={otp6} onChange={setOtp6} />
        <p className="mt-3 text-sm text-zinc-500">Value: {otp6 || "(empty)"}</p>
      </DemoSection>

      <DemoSection title="4-Digit Code" description="Shorter PIN input." code={`<OtpInput length={4} value={otp} onChange={setOtp} />`}>
        <OtpInput length={4} value={otp4} onChange={setOtp4} />
        <p className="mt-3 text-sm text-zinc-500">Value: {otp4 || "(empty)"}</p>
      </DemoSection>

      <DemoSection title="Disabled" description="OTP input in disabled state." code={`<OtpInput length={6} value="123456" disabled />`}>
        <OtpInput length={6} value="123456" disabled />
      </DemoSection>
    </div>
  );
}
