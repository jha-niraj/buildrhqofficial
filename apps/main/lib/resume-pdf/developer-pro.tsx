import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { ResumeDraftContent } from '@/types/resume-draft'

const DARK = '#0a0a0a'
const ACCENT = '#171717'
const SIDEBAR_BG = '#171717'

const styles = StyleSheet.create({
    page: { fontFamily: 'Helvetica', fontSize: 8.5, color: '#1a1a1a', flexDirection: 'row' },
    sidebar: { width: '32%', backgroundColor: SIDEBAR_BG, padding: 20, color: '#e5e5e5' },
    main: { flex: 1, padding: 24 },
    sName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#fff', marginBottom: 2 },
    sTitle: { fontSize: 9, color: '#a3a3a3', marginBottom: 12 },
    sSection: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 5 },
    sText: { fontSize: 8, color: '#d4d4d4', lineHeight: 1.4 },
    sContact: { fontSize: 7.5, color: '#a3a3a3', marginBottom: 2 },
    skillPill: { backgroundColor: '#404040', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, marginRight: 3, marginBottom: 3, fontSize: 7.5, color: '#e5e5e5' },
    mSection: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 1, marginTop: 10, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: ACCENT, paddingBottom: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    bold: { fontFamily: 'Helvetica-Bold' },
    muted: { color: '#737373' },
    bullet: { flexDirection: 'row', marginTop: 1.5 },
    dot: { width: 3, height: 3, backgroundColor: ACCENT, borderRadius: 2, marginRight: 5, marginTop: 3 },
})

function MBullet({ text }: { text: string }) {
    return <View style={styles.bullet}><View style={styles.dot} /><Text style={{ color: '#404040', flex: 1, lineHeight: 1.4 }}>{text}</Text></View>
}
function fmt(d?: string) {
    if (!d) return ''
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) } catch { return d }
}

export function DeveloperProTemplate({ content }: { content: ResumeDraftContent }) {
    const { header, experience, projects, education, skills, certifications } = content

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Sidebar */}
                <View style={styles.sidebar}>
                    <Text style={styles.sName}>{header.name}</Text>
                    <Text style={styles.sTitle}>{header.title}</Text>

                    {/* Contact */}
                    <Text style={styles.sSection}>Contact</Text>
                    {header.email && <Text style={styles.sContact}>✉ {header.email}</Text>}
                    {header.phone && <Text style={styles.sContact}>✆ {header.phone}</Text>}
                    {header.location && <Text style={styles.sContact}>⌖ {header.location}</Text>}
                    {header.github && <Text style={styles.sContact}>⌁ {header.github}</Text>}
                    {header.linkedin && <Text style={styles.sContact}>in {header.linkedin}</Text>}
                    {header.website && <Text style={styles.sContact}>⊕ {header.website}</Text>}

                    {/* Skills */}
                    {skills.length > 0 && (
                        <>
                            <Text style={styles.sSection}>Skills</Text>
                            {skills.map(g => (
                                <View key={g.category} style={{ marginBottom: 6 }}>
                                    <Text style={{ ...styles.sContact, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>{g.category}</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                        {g.items.map((s, i) => <View key={i} style={styles.skillPill}><Text>{s}</Text></View>)}
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    {/* Certifications sidebar */}
                    {certifications.length > 0 && (
                        <>
                            <Text style={styles.sSection}>Certifications</Text>
                            {certifications.map(c => (
                                <View key={c.id} style={{ marginBottom: 4 }}>
                                    <Text style={{ ...styles.sText, fontFamily: 'Helvetica-Bold' }}>{c.name}</Text>
                                    {c.issuer && <Text style={styles.sContact}>{c.issuer}</Text>}
                                </View>
                            ))}
                        </>
                    )}

                    {/* Education sidebar */}
                    {education.length > 0 && (
                        <>
                            <Text style={styles.sSection}>Education</Text>
                            {education.map(e => (
                                <View key={e.id} style={{ marginBottom: 6 }}>
                                    <Text style={{ ...styles.sText, fontFamily: 'Helvetica-Bold' }}>{e.institution}</Text>
                                    {e.degree && <Text style={styles.sContact}>{e.degree}</Text>}
                                    <Text style={styles.sContact}>{fmt(e.startDate)} - {fmt(e.endDate)}</Text>
                                </View>
                            ))}
                        </>
                    )}
                </View>

                {/* Main content */}
                <View style={styles.main}>
                    {/* Summary */}
                    {header.summary && (
                        <View style={{ marginBottom: 8, borderLeftWidth: 3, borderLeftColor: ACCENT, paddingLeft: 8 }}>
                            <Text style={{ color: '#525252', lineHeight: 1.5 }}>{header.summary}</Text>
                        </View>
                    )}

                    {/* Experience */}
                    {experience.length > 0 && (
                        <View>
                            <Text style={styles.mSection}>Experience</Text>
                            {experience.map(e => (
                                <View key={e.id} style={{ marginBottom: 8 }}>
                                    <View style={styles.row}>
                                        <Text style={styles.bold}>{e.role}</Text>
                                        <Text style={styles.muted}>{fmt(e.startDate)} - {e.current ? 'Present' : fmt(e.endDate)}</Text>
                                    </View>
                                    <Text style={{ color: ACCENT, marginBottom: 2 }}>{e.company}</Text>
                                    {e.bullets.map((b, i) => <MBullet key={i} text={b} />)}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Projects */}
                    {projects.length > 0 && (
                        <View>
                            <Text style={styles.mSection}>Projects</Text>
                            {projects.map(p => (
                                <View key={p.id} style={{ marginBottom: 7 }}>
                                    <View style={styles.row}>
                                        <Text style={styles.bold}>{p.name}</Text>
                                        {p.liveUrl && <Text style={styles.muted}>{p.liveUrl}</Text>}
                                    </View>
                                    {p.technologies.length > 0 && (
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 2 }}>
                                            {p.technologies.map((t, i) => (
                                                <View key={i} style={{ backgroundColor: '#f5f5f5', borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1, marginRight: 3, marginBottom: 2 }}>
                                                    <Text style={{ fontSize: 7, color: '#525252' }}>{t}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    {p.bullets.map((b, i) => <MBullet key={i} text={b} />)}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </Page>
        </Document>
    )
}
