import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { EbookConteudo } from '@/lib/types'

const styles = StyleSheet.create({
  // Capa
  capa: {
    flex: 1,
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    padding: 60,
    justifyContent: 'center',
  },
  capaTitulo: { fontSize: 34, fontFamily: 'Helvetica-Bold', lineHeight: 1.2 },
  capaSubtitulo: { fontSize: 16, marginTop: 16, color: '#e0e7ff', lineHeight: 1.4 },
  capaMarca: { position: 'absolute', bottom: 50, left: 60, fontSize: 12, color: '#c7d2fe' },

  // Conteúdo
  page: { padding: 50, paddingBottom: 70, fontSize: 11, fontFamily: 'Helvetica', color: '#1f2937', lineHeight: 1.6 },
  secaoLabel: { fontSize: 10, color: '#6366f1', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  capituloNum: { fontSize: 11, color: '#9ca3af', fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  capituloTitulo: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 14 },
  paragrafo: { marginBottom: 10, textAlign: 'justify' },
  rodape: { position: 'absolute', bottom: 30, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', fontSize: 9, color: '#9ca3af', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
})

function Paragrafos({ texto }: { texto: string }) {
  const partes = texto.split(/\n\s*\n/).filter((p) => p.trim())
  return (
    <>
      {partes.map((p, i) => (
        <Text key={i} style={styles.paragrafo}>{p.trim()}</Text>
      ))}
    </>
  )
}

function Rodape({ titulo }: { titulo: string }) {
  return (
    <View style={styles.rodape} fixed>
      <Text>{titulo}</Text>
      <Text render={({ pageNumber }) => `${pageNumber}`} />
    </View>
  )
}

export function EbookDocument({ conteudo }: { conteudo: EbookConteudo }) {
  return (
    <Document title={conteudo.titulo}>
      {/* Capa */}
      <Page size="A4">
        <View style={styles.capa}>
          <Text style={styles.capaTitulo}>{conteudo.titulo}</Text>
          {conteudo.subtitulo ? (
            <Text style={styles.capaSubtitulo}>{conteudo.subtitulo}</Text>
          ) : null}
          <Text style={styles.capaMarca}>Micro Guias</Text>
        </View>
      </Page>

      {/* Introdução */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.secaoLabel}>Introdução</Text>
        <Text style={styles.capituloTitulo}>Antes de começar</Text>
        <Paragrafos texto={conteudo.introducao} />
        <Rodape titulo={conteudo.titulo} />
      </Page>

      {/* Capítulos */}
      {conteudo.capitulos.map((cap, i) => (
        <Page key={i} size="A4" style={styles.page}>
          <Text style={styles.capituloNum}>Capítulo {i + 1}</Text>
          <Text style={styles.capituloTitulo}>{cap.titulo}</Text>
          <Paragrafos texto={cap.conteudo} />
          <Rodape titulo={conteudo.titulo} />
        </Page>
      ))}

      {/* Conclusão */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.secaoLabel}>Conclusão</Text>
        <Text style={styles.capituloTitulo}>Considerações finais</Text>
        <Paragrafos texto={conteudo.conclusao} />
        <Rodape titulo={conteudo.titulo} />
      </Page>
    </Document>
  )
}
