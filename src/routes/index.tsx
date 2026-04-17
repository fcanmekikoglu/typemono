import { createFileRoute, redirect } from '@tanstack/react-router'
import { createDoc, getDoc, getLastOpened, listDocs } from '../lib/docs'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const lastId = await getLastOpened()
    if (lastId) {
      const doc = await getDoc(lastId)
      if (doc) throw redirect({ to: '/doc/$docId', params: { docId: doc.id } })
    }
    const docs = await listDocs()
    if (docs.length > 0) {
      throw redirect({ to: '/doc/$docId', params: { docId: docs[0].id } })
    }
    const fresh = await createDoc()
    throw redirect({ to: '/doc/$docId', params: { docId: fresh.id } })
  },
  component: () => null,
})
