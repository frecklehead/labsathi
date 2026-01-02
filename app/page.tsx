import Image from "next/image";
import { Tube } from "./components/lab/Tube";

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
    </div>
  );
}
