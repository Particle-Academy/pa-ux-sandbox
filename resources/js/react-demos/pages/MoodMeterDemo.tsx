import { useState } from "react";
import { MoodMeter, Card, Select, Slider, Action } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

const SCALES = {
  price: { id: "price", label: "Renewal price (k)", min: 30, max: 200, step: 1, prefix: "$", suffix: "k", postedValue: 60, postedConfidence: 0.74 },
  temp: { id: "temp", label: "LLM temperature", min: 0, max: 1, step: 0.01, postedValue: 0.35, postedConfidence: 0.88 },
  prob: { id: "prob", label: "Win probability", min: 0, max: 1, step: 0.01, postedValue: 0.62, postedConfidence: 0.41, suffix: "%" },
};

export function MoodMeterDemo() {
  const [scaleId, setScaleId] = useState<keyof typeof SCALES>("price");
  const scale = SCALES[scaleId];
  const [value, setValue] = useState(scale.postedValue);
  const [conf, setConf] = useState(scale.postedConfidence);

  const onScaleChange = (id: keyof typeof SCALES) => {
    setScaleId(id);
    setValue(SCALES[id].postedValue);
    setConf(SCALES[id].postedConfidence);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">MoodMeter</h1>
        <p className="mt-2 text-zinc-500">
          2D pad that captures a value and the confidence in it together. Drag the
          handle horizontally to set the value, vertically to set how sure you are.
          The halo around the handle shrinks as confidence rises.
        </p>
      </header>

      <DemoSection title="Pick a scale" description="Three different use cases.">
        <Card>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <Select
              label="Scale"
              list={[
                { value: "price", label: "Renewal price (k) · 30–200" },
                { value: "temp", label: "LLM temperature · 0–1" },
                { value: "prob", label: "Win probability · 0–1" },
              ]}
              value={scaleId}
              onValueChange={(v) => onScaleChange(v as keyof typeof SCALES)}
            />
            <div className="flex items-end justify-end gap-2">
              <Action
                variant="outline"
                size="sm"
                onClick={() => {
                  setValue(scale.postedValue);
                  setConf(scale.postedConfidence);
                }}
              >
                adopt agent post
              </Action>
            </div>
          </div>
        </Card>
      </DemoSection>

      <DemoSection title="Pad" description="Drag to set value × confidence. Dashed handle is the agent's posted reading.">
        <Card>
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[auto_1fr]">
            <div className="flex justify-center">
              <MoodMeter
                min={scale.min}
                max={scale.max}
                step={scale.step}
                value={value}
                confidence={conf}
                onChange={(v, c) => {
                  setValue(v);
                  setConf(c);
                }}
                posted={{ value: scale.postedValue, confidence: scale.postedConfidence }}
                prefix={scale.prefix}
                suffix={scale.suffix}
              />
            </div>
            <div className="space-y-4">
              <Slider
                label="Value"
                min={scale.min}
                max={scale.max}
                step={scale.step}
                value={value}
                onValueChange={(v) => setValue(typeof v === "number" ? v : v[0])}
                showValue
                prefix={scale.prefix}
                suffix={scale.suffix}
              />
              <Slider
                label="Confidence"
                min={0}
                max={1}
                step={0.01}
                value={conf}
                onValueChange={(v) => setConf(typeof v === "number" ? v : v[0])}
                showValue
              />
            </div>
          </div>
        </Card>
      </DemoSection>
    </div>
  );
}
