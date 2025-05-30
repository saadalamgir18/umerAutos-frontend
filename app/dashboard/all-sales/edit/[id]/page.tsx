
import { use } from "react"
import EditSalePage from "./EditSalePage"

type Props = {
  params: Promise<{ id: string }>
}

export default function Page({ params }: Props ) {

  const { id } = use(params)

  return <EditSalePage id={id} />

}
