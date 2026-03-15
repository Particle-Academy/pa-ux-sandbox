import { useState } from "react";
import {
  Input,
  Textarea,
  Select,
  Switch,
  Slider,
  RadioGroup,
  Autocomplete,
  Pillbox,
  MultiSwitch,
  ColorPicker,
  FileUpload,
  Action,
  Card,
} from "@particle-academy/react-fancy";
import type { KitchenSinkState, KitchenSinkAction } from "./types";
import { TOOL_OPTIONS, INITIAL_CONFIG } from "./data";

interface SettingsTabProps {
  state: KitchenSinkState;
  dispatch: React.Dispatch<KitchenSinkAction>;
}

export function SettingsTab({ state, dispatch }: SettingsTabProps) {
  const { config } = state;
  const [themeColor, setThemeColor] = useState("#6366f1");
  const [files, setFiles] = useState<File[]>([]);
  const [toolSearch, setToolSearch] = useState("");
  const [responseFormat, setResponseFormat] = useState("text");

  const update = (partial: Partial<typeof config>) => {
    dispatch({ type: "UPDATE_CONFIG", payload: partial });
  };

  const handleReset = () => {
    dispatch({ type: "UPDATE_CONFIG", payload: INITIAL_CONFIG });
    setThemeColor("#6366f1");
    setFiles([]);
    setToolSearch("");
    setResponseFormat("text");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* General Settings */}
      <Card variant="outlined">
        <Card.Header>
          <h3 className="font-semibold">General</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Agent Name"
              value={config.name}
              onValueChange={(v) => update({ name: v })}
              placeholder="My Agent"
            />
            <Select
              label="Model"
              value={config.model}
              onValueChange={(v) => update({ model: v })}
              list={[
                { label: "OpenAI", options: [
                  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
                  { value: "gpt-4o", label: "GPT-4o" },
                  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
                ]},
                { label: "Anthropic", options: [
                  { value: "claude-3-opus", label: "Claude 3 Opus" },
                  { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
                ]},
              ]}
            />
            <div className="sm:col-span-2">
              <Textarea
                label="System Prompt"
                value={config.systemPrompt}
                onValueChange={(v) => update({ systemPrompt: v })}
                placeholder="You are a helpful assistant..."
                minRows={3}
                autoResize
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Model Parameters */}
      <Card variant="outlined">
        <Card.Header>
          <h3 className="font-semibold">Model Parameters</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid gap-6 sm:grid-cols-2">
            <Slider
              label="Temperature"
              min={0}
              max={2}
              step={0.1}
              value={config.temperature}
              onValueChange={(v) => update({ temperature: v as number })}
              showValue
            />
            <Slider
              label="Max Tokens"
              min={256}
              max={16384}
              step={256}
              value={config.maxTokens}
              onValueChange={(v) => update({ maxTokens: v as number })}
              showValue
            />
          </div>
        </Card.Body>
      </Card>

      {/* Toggles */}
      <Card variant="outlined">
        <Card.Header>
          <h3 className="font-semibold">Features</h3>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-col gap-4">
            <Switch
              label="Streaming"
              description="Stream responses token by token"
              checked={config.streaming}
              onCheckedChange={(v) => update({ streaming: v })}
            />
            <Switch
              label="Memory"
              description="Persist conversation history across runs"
              checked={config.memory}
              onCheckedChange={(v) => update({ memory: v })}
            />
            <Switch
              label="Debug Logging"
              description="Log all intermediate steps"
              checked={config.logging}
              onCheckedChange={(v) => update({ logging: v })}
              color="amber"
            />
          </div>
        </Card.Body>
      </Card>

      {/* Response & Environment */}
      <Card variant="outlined">
        <Card.Header>
          <h3 className="font-semibold">Output & Environment</h3>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-col gap-5">
            <RadioGroup
              label="Response Format"
              value={responseFormat}
              onValueChange={setResponseFormat}
              orientation="horizontal"
              list={[
                { value: "text", label: "Plain Text" },
                { value: "markdown", label: "Markdown" },
                { value: "json", label: "JSON" },
              ]}
            />
            <MultiSwitch
              label="Environment"
              list={["Dev", "Staging", "Prod"]}
              value={config.environment}
              onValueChange={(v) => update({ environment: v })}
            />
          </div>
        </Card.Body>
      </Card>

      {/* Tools & Tags */}
      <Card variant="outlined">
        <Card.Header>
          <h3 className="font-semibold">Tools & Tags</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid gap-4 sm:grid-cols-2">
            <Autocomplete
              options={TOOL_OPTIONS}
              value={toolSearch}
              onChange={setToolSearch}
              placeholder="Search tools..."
            />
            <Pillbox
              value={config.tags}
              onChange={(v) => update({ tags: v })}
              placeholder="Add tags..."
            />
          </div>
        </Card.Body>
      </Card>

      {/* Theme & Knowledge */}
      <Card variant="outlined">
        <Card.Header>
          <h3 className="font-semibold">Appearance & Data</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Theme Color</p>
              <ColorPicker value={themeColor} onChange={setThemeColor} />
            </div>
            <div>
              <FileUpload value={files} onChange={setFiles} maxFiles={3}>
                <FileUpload.Dropzone />
                <FileUpload.List />
              </FileUpload>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Action onClick={() => {}}>Save Configuration</Action>
        <Action onClick={handleReset}>Reset to Defaults</Action>
      </div>
    </div>
  );
}
