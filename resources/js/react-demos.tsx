import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { Home } from "./react-demos/pages/Home";
import { ActionDemo } from "./react-demos/pages/ActionDemo";
import { CarouselDemo } from "./react-demos/pages/CarouselDemo";
import { ColorPickerDemo } from "./react-demos/pages/ColorPickerDemo";
import { EmojiDemo } from "./react-demos/pages/EmojiDemo";
import { EmojiSelectDemo } from "./react-demos/pages/EmojiSelectDemo";
import { TableDemo } from "./react-demos/pages/TableDemo";
import { InputsDemo } from "./react-demos/pages/InputsDemo";
import { WizardDemo } from "./react-demos/pages/WizardDemo";
import { NestedCarouselDemo } from "./react-demos/pages/NestedCarouselDemo";
import { DynamicCarouselDemo } from "./react-demos/pages/DynamicCarouselDemo";
import { DemoLayout } from "./react-demos/layouts/DemoLayout";

const root = document.getElementById("react-demos");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter basename="/react-demos">
        <Routes>
          <Route element={<DemoLayout />}>
            <Route index element={<Home />} />
            <Route path="action" element={<ActionDemo />} />
            <Route path="carousel" element={<CarouselDemo />} />
            <Route path="color-picker" element={<ColorPickerDemo />} />
            <Route path="emoji" element={<EmojiDemo />} />
            <Route path="emoji-select" element={<EmojiSelectDemo />} />
            <Route path="inputs" element={<InputsDemo />} />
            <Route path="table" element={<TableDemo />} />
            <Route path="wizard" element={<WizardDemo />} />
            <Route path="nested-carousel" element={<NestedCarouselDemo />} />
            <Route path="dynamic-carousel" element={<DynamicCarouselDemo />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StrictMode>
  );
}
