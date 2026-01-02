import Image from "next/image";
import { Tube } from "./components/lab/Tube";
import { Burette } from "./components/lab/Burette";
import { Flask } from "./components/lab/Flask";
export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center", // horizontal
        alignItems: "center",     // vertical
        height: "100vh",          // full viewport height
      }}
    >
      <Tube />
      <Burette/>
      <Flask/>
    </div>
  );
}
