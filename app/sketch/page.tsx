import SketchCanvas from "@/app/components/sketch/SketchCanvas";
import SketchToolbar from "@/app/components/sketch/SketchToolbar";

export default function Page() {
  return (
    <div className="w-full h-full flex flex-col">
      <SketchToolbar />
      <div className="flex-1">
        <SketchCanvas />
      </div>
    </div>
  );
}
