import { createProperty } from "../../actions";
import { PropertyForm } from "../PropertyForm";

export default function NewProperty() {
  return (
    <>
      <h1>Añadir piso</h1>
      <PropertyForm action={createProperty} submitLabel="Guardar piso" />
    </>
  );
}
