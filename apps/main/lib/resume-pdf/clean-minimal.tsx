import {
    Document, Page, Text, View, StyleSheet
} from '@react-pdf/renderer'
import { ResumeDraftContent } from '@/types/resume-draft'

const ACCENT = '#171717'

const styles = StyleSheet.create({
    page: { fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', paddingHorizontal: 40, paddingVertical: 36 },
    name: { fontSize: 22, fontWeight: 'bold', letterSpacing: 0.5 },
    title: { fontSize: 11, color: '#555', marginTop: 2, marginBottom: 6 },
    contact: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, fontSize: 8, color: '#555', marginBottom: 12, borderBottomWidth: 1.5, borderBottomColor: ACCENT, paddingBottom: 8 },
    sectionHeader: { fontSize: 10, fontWeight: 'bold', color: ACCENT, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 10, marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#ddd', paddingBottom: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    bold: { fontFamily: 'Helvetica-Bold' },
    muted: { color: '#666' },
    bullet: { marginLeft: 8, marginTop: 1 },
    dot: { width: 3, marginRight: 4, marginTop: 3, height: 3, backgroundColor: '#999', borderRadius: 2 },
    tag: { backgroundColor: '#f5f5f5', borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1, marginRight: 3, marginBottom: 2, fontSize: 7.5 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
    skillGroup: { marginBottom: 4 },
    summary: { color: '#444', lineHeight: 1.5, marginBottom: 8 },
})

function Bullet({ text }: { text: string }) {
    return (
        <View style={{ flexDirection: 'row', marginTop: 1.5 }}>
            <View style={styles.dot} />
            <Text style={{ flex: 1, color: '#333', lineHeight: 1.4 }}>{text}</Text>
        </View>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View>
            <Text style={styles.sectionHeader}>{title}</Text>
            {children}
        </View>
    )
}

function formatDate(d?: string) {
    if (!d) return ''
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) } catch { return d }
}

export function CleanMinimalTemplate({ content }: { content: ResumeDraftContent }) {
    const { header, experience, projects, education, skills, certifications } = content
    const links = [header.email, header.phone, header.location, header.linkedin, header.github, header.website].filter(Boolean)

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <Text style={styles.name}>{header.name}</Text>
                {header.title && <Text style={styles.title}>{header.title}</Text>}
                <View style={styles.contact}>
                    {links.map((l, i) => <Text key={i}>{l}</Text>)}
                </View>

                {/* Summary */}
                {header.summary && (
                    <Section title="Summary">
                        <Text style={styles.summary}>{header.summary}</Text>
                    </Section>
                )}

                {/* Experience */}
                {experience.length > 0 && (
                    <Section title="Experience">
                        {experience.map(e => (
                            <View key={e.id} style={{ marginBottom: 7 }}>
                                <View style={styles.row}>
                                    <Text style={styles.bold}>{e.role} - {e.company}</Text>
                                    <Text style={styles.muted}>{formatDate(e.startDate)} - {e.current ? 'Present' : formatDate(e.endDate)}</Text>
                                </View>
                                {e.bullets.map((b, i) => <Bullet key={i} text={b} />)}
                            </View>
                        ))}
                    </Section>
                )}

                {/* Skills */}
                {skills.length > 0 && (
                    <Section title="Skills">
                        {skills.map(g => (
                            <View key={g.category} style={styles.skillGroup}>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Text style={{ ...styles.bold, marginRight: 4 }}>{g.category}: </Text>
                                    <Text style={styles.muted}>{g.items.join(' • ')}</Text>
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {/* Projects */}
                {projects.length > 0 && (
                    <Section title="Projects">
                        {projects.map(p => (
                            <View key={p.id} style={{ marginBottom: 6 }}>
                                <View style={styles.row}>
                                    <Text style={styles.bold}>{p.name}</Text>
                                    {p.github && <Text style={styles.muted}>{p.github}</Text>}
                                </View>
                                {p.technologies.length > 0 && (
                                    <Text style={{ color: '#666', marginTop: 1 }}>{p.technologies.join(', ')}</Text>
                                )}
                                {p.bullets.map((b, i) => <Bullet key={i} text={b} />)}
                            </View>
                        ))}
                    </Section>
                )}

                {/* Education */}
                {education.length > 0 && (
                    <Section title="Education">
                        {education.map(e => (
                            <View key={e.id} style={{ marginBottom: 5 }}>
                                <View style={styles.row}>
                                    <Text style={styles.bold}>{e.degree ? `${e.degree}, ${e.institution}` : e.institution}</Text>
                                    <Text style={styles.muted}>{formatDate(e.startDate)} - {formatDate(e.endDate)}</Text>
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {/* Certifications */}
                {certifications.length > 0 && (
                    <Section title="Certifications">
                        {certifications.map(c => (
                            <View key={c.id} style={{ flexDirection: 'row', marginBottom: 2 }}>
                                <Text style={styles.bold}>{c.name}</Text>
                                {c.issuer && <Text style={styles.muted}> - {c.issuer}{c.date ? `, ${formatDate(c.date)}` : ''}</Text>}
                            </View>
                        ))}
                    </Section>
                )}
            </Page>
        </Document>
    )
}
