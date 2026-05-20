import type { ComponentDoc } from "./types";
import { FileUpload, Text } from "@particle-academy/react-fancy";

export const fileUploadDoc: ComponentDoc = {
    intro: (
        <p>
            Drag-and-drop or click-to-browse file picker. Compound:
            <code>FileUpload.Dropzone</code> is the drop target and
            <code>FileUpload.List</code> renders the picked files. Controlled
            (<code>value</code> + <code>onChange</code>) or uncontrolled.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Default zone + list — accepts any file, single at a time.",
            render: () => (
                <div className="w-full max-w-md">
                    <FileUpload onChange={() => {}}>
                        <FileUpload.Dropzone />
                        <FileUpload.List />
                    </FileUpload>
                </div>
            ),
            code: `const [files, setFiles] = useState<File[]>([]);

<FileUpload value={files} onChange={setFiles}>
    <FileUpload.Dropzone />
    <FileUpload.List />
</FileUpload>`,
        },
        {
            name: "Multiple + accept",
            description: "Allow multiple files and restrict by mime type or extension.",
            render: () => (
                <div className="w-full max-w-md">
                    <FileUpload multiple accept="image/*" maxFiles={5} onChange={() => {}}>
                        <FileUpload.Dropzone>
                            <div className="text-center">
                                <Text size="sm" weight="semibold">Drop images here</Text>
                                <Text size="xs" className="mt-1 !text-zinc-500">PNG, JPG, GIF · up to 5 files</Text>
                            </div>
                        </FileUpload.Dropzone>
                        <FileUpload.List thumbnail />
                    </FileUpload>
                </div>
            ),
            code: `<FileUpload
    multiple
    accept="image/*"
    maxFiles={5}
    onChange={setFiles}
>
    <FileUpload.Dropzone>
        <div>Drop images here</div>
    </FileUpload.Dropzone>
    <FileUpload.List thumbnail />
</FileUpload>`,
        },
        {
            name: "Max size",
            description: "`maxSize` (in bytes) rejects files above the limit.",
            render: () => (
                <div className="w-full max-w-md">
                    <FileUpload maxSize={5 * 1024 * 1024} onChange={() => {}}>
                        <FileUpload.Dropzone>
                            <Text size="xs" className="!text-zinc-500">Max 5 MB per file</Text>
                        </FileUpload.Dropzone>
                        <FileUpload.List />
                    </FileUpload>
                </div>
            ),
            code: `<FileUpload maxSize={5 * 1024 * 1024} onChange={setFiles}>
    <FileUpload.Dropzone>Max 5 MB per file</FileUpload.Dropzone>
    <FileUpload.List />
</FileUpload>`,
        },
        {
            name: "Disabled",
            render: () => (
                <div className="w-full max-w-md">
                    <FileUpload disabled onChange={() => {}}>
                        <FileUpload.Dropzone />
                    </FileUpload>
                </div>
            ),
            code: `<FileUpload disabled onChange={setFiles}>
    <FileUpload.Dropzone />
</FileUpload>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Should contain a `FileUpload.Dropzone` and (optionally) a `FileUpload.List`." },
        { name: "value", type: `File[]`, default: "—", description: "Controlled file list. Use with `onChange`." },
        { name: "onChange", type: `(files: File[]) => void`, default: "—", description: "Called when files are added / removed." },
        { name: "accept", type: `string`, default: "—", description: "MIME or extension filter (`image/*`, `.pdf,.docx`). Passed straight to the native file input." },
        { name: "multiple", type: `boolean`, default: `false`, description: "Allow multiple files." },
        { name: "maxFiles", type: `number`, default: "—", description: "Cap total files. Implies `multiple`." },
        { name: "maxSize", type: `number`, default: "—", description: "Max bytes per file. Files above the limit are rejected." },
        { name: "disabled", type: `boolean`, default: `false`, description: "Disable the picker." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Children:</strong> <code>FileUpload.Dropzone</code> accepts arbitrary children
            (override the default empty message). <code>FileUpload.List</code> has a
            <code>thumbnail</code> prop that shows image previews for image files.
        </p>
    ),
};
