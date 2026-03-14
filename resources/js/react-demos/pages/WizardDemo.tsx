import { useState } from "react";
import { Carousel, useCarousel } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

const steps = ["Account", "Profile", "Review"] as const;

function StepIndicator() {
  const { activeIndex } = useCarousel();

  return (
    <div className="mb-6 flex items-center justify-center gap-0">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                i < activeIndex
                  ? "bg-blue-600 text-white"
                  : i === activeIndex
                    ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
              }`}
            >
              {i < activeIndex ? "\u2713" : i + 1}
            </div>
            <span className="mt-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mx-3 mb-5 h-0.5 w-12 transition-colors ${
                i < activeIndex
                  ? "bg-blue-600"
                  : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function WizardContent({
  form,
  setForm,
  onComplete,
}: {
  form: { email: string; password: string; fullName: string; bio: string };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  onComplete: () => void;
}) {
  const { activeIndex, next, prev } = useCarousel();

  return (
    <>
      <StepIndicator />

      <Carousel.Panels>
        {/* Step 1: Account */}
        <Carousel.Slide>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Create Your Account</h3>
            <p className="mt-1 mb-4 text-sm text-zinc-500">
              Enter your email and password to get started.
            </p>
            <div className="max-w-sm space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</span>
                <input
                  type="email"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </span>
                <input
                  type="password"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
              </label>
            </div>
          </div>
        </Carousel.Slide>

        {/* Step 2: Profile */}
        <Carousel.Slide>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Complete Your Profile</h3>
            <p className="mt-1 mb-4 text-sm text-zinc-500">
              Tell us a bit about yourself.
            </p>
            <div className="max-w-sm space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Full Name
                </span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Bio</span>
                <textarea
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="A short bio..."
                  rows={3}
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                />
              </label>
            </div>
          </div>
        </Carousel.Slide>

        {/* Step 3: Review */}
        <Carousel.Slide>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Review & Confirm</h3>
            <p className="mt-1 mb-4 text-sm text-zinc-500">
              Review your information before submitting.
            </p>
            <div className="space-y-2 text-sm">
              {[
                ["Email", form.email],
                ["Name", form.fullName],
                ["Bio", form.bio],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b border-zinc-200 py-2 dark:border-zinc-700"
                >
                  <span className="text-zinc-500">{label}</span>
                  <span className="max-w-xs truncate text-zinc-900 dark:text-zinc-100">
                    {value || "Not provided"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Carousel.Slide>
      </Carousel.Panels>

      {/* Navigation buttons */}
      <div className="mt-4 flex justify-between px-6">
        <button
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          onClick={prev}
          disabled={activeIndex === 0}
        >
          Back
        </button>
        {activeIndex < steps.length - 1 ? (
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            onClick={next}
          >
            Next
          </button>
        ) : (
          <button
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            onClick={onComplete}
          >
            Complete
          </button>
        )}
      </div>
    </>
  );
}

export function WizardDemo() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    bio: "",
  });
  const [completed, setCompleted] = useState(false);

  function handleReset() {
    setForm({ email: "", password: "", fullName: "", bio: "" });
    setCompleted(false);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Wizard Form</h1>

      <DemoSection
        title="Multi-Step Wizard"
        description="A form wizard built on the Carousel component using useCarousel() for step navigation."
      >
        {completed ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <span className="text-3xl text-green-600 dark:text-green-400">
                {"\u2713"}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Wizard Complete!</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Your form has been submitted successfully.
            </p>
            <button
              className="mt-4 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              onClick={handleReset}
            >
              Start Over
            </button>
          </div>
        ) : (
          <Carousel className="max-w-2xl">
            <WizardContent
              form={form}
              setForm={setForm}
              onComplete={() => setCompleted(true)}
            />
          </Carousel>
        )}
      </DemoSection>
    </div>
  );
}
