import { useState } from "react";
import { FileUpload } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function FileUploadDemo() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">FileUpload</h1>

      <DemoSection title="Basic" description="Drag-and-drop file upload with file list." code={`<FileUpload value={files} onChange={setFiles} maxFiles={5}>
  <FileUpload.Dropzone />
  <FileUpload.List />
</FileUpload>`}>
        <div className="max-w-md">
          <FileUpload value={files} onChange={setFiles} maxFiles={5}>
            <FileUpload.Dropzone />
            <FileUpload.List />
          </FileUpload>
          <p className="mt-2 text-sm text-zinc-500">{files.length} file(s) selected</p>
        </div>
      </DemoSection>

      <DemoSection title="Thumbnail List" description="Display file previews as thumbnails." code={`<FileUpload value={files} onChange={setFiles}>
  <FileUpload.Dropzone />
  <FileUpload.List thumbnail />
</FileUpload>`}>
        <div className="max-w-md">
          <FileUpload value={files} onChange={setFiles}>
            <FileUpload.Dropzone />
            <FileUpload.List thumbnail />
          </FileUpload>
        </div>
      </DemoSection>

      <DemoSection title="Disabled" description="Upload area in disabled state." code={`<FileUpload disabled>
  <FileUpload.Dropzone />
</FileUpload>`}>
        <div className="max-w-md">
          <FileUpload disabled>
            <FileUpload.Dropzone />
          </FileUpload>
        </div>
      </DemoSection>
    </div>
  );
}
