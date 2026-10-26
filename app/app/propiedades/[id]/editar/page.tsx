import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { deleteProperty, updateProperty } from "../../../actions";
import { PropertyForm } from "../../PropertyForm";
import type { Property } from "@/lib/types";
import { ConfirmSubmit } from "../../../ConfirmSubmit";

export default async function EditProperty({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("properties").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <>
      <h1>Editar {data.name}</h1>
      <PropertyForm action={updateProperty.bind(null, id)} property={data as Property} submitLabel="Guardar cambios" />
      <form action={deleteProperty.bind(null, id)}>
        <ConfirmSubmit
          className="btn danger small"
          message={`¿Eliminar «${data.name}»? Se borrarán también sus cobros y su historial de rentas. No se puede deshacer.`}
        >
          Eliminar este piso y sus cobros
        </ConfirmSubmit>
      </form>
    </>
  );
}
