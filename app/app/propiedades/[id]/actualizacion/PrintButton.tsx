"use client";

export function PrintButton() {
  return <button className="btn" onClick={() => window.print()}>Imprimir o guardar en PDF</button>;
}
