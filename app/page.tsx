import { InspectionDemo } from "./components/inspection-demo";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(244,177,72,0.32),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(110,64,26,0.22),transparent_30%),linear-gradient(180deg,#f7f0e2_0%,#efe3cf_48%,#e4d3b8_100%)] px-6 py-10 text-stone-950 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-600">
            Hackathon La Virginia
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
            Cámara, upload y validación conectados al modelo de calidad.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700 md:text-lg">
            Esta pantalla ya queda lista para demo: la imagen sale desde el browser,
            entra por Next, pasa al backend Node y termina en el modelo Python.
          </p>
        </header>

        <InspectionDemo />
      </div>
    </main>
  );
}
