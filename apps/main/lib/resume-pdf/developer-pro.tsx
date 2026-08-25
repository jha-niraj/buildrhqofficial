import { Document, Page, Text, View, Link, StyleSheet } from '@react-pdf/renderer'
import { ResumeDraftContent } from '@/types/resume-draft'
import { handleFor, hrefFor, paragraphsOf, formatRange } from '@/lib/resume-links'

const DARK = '#0a0a0a'
const ACCENT = '#171717'
const SIDEBAR_BG = '#171717'
/**
 * Ink for the sidebar, which is a DARK surface in every theme.
 *
 * `sSection` used `ACCENT` - and `ACCENT` is '#171717', the exact value of `SIDEBAR_BG`.
 * So "CONTACT", "SKILLS", "CERTIFICATIONS" and "EDUCATION" were rendered black on black at
 * a contrast ratio of 1.00:1 and did not appear in the PDF at all. CLAUDE.md's rule is
 * literally this case: "If a surface is constant across themes, its ink must be constant
 * too" - check the rendered contrast, not the name of the constant.
 *
 * #a3a3a3 on #171717 measures 6.4:1, past AA for body text.
 */
const SIDEBAR_HEADING = '#a3a3a3'

const styles = StyleSheet.create({
    page: { fontFamily: 'Helvetica', fontSize: 8.5, lineHeight: 1.35, color: '#1a1a1a', flexDirection: 'row' },
    sidebar: { width: '32%', backgroundColor: SIDEBAR_BG, padding: 20, color: '#e5e5e5' },
    main: { flex: 1, padding: 24 },
    sName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#fff', lineHeight: 1.2, marginBottom: 2 },
    sTitle: { fontSize: 9, color: '#a3a3a3', marginBottom: 12 },
    sSection: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: SIDEBAR_HEADING, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 5 },
    sText: { fontSize: 8, color: '#d4d4d4', lineHeight: 1.4 },
    sContact: { fontSize: 7.5, color: '#a3a3a3', marginBottom: 2 },
    sLink: { fontSize: 7.5, color: '#a3a3a3', marginBottom: 2, textDecoration: 'none' },
    skillPill: { backgroundColor: '#404040', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, marginRight: 3, marginBottom: 3, fontSize: 7.5, color: '#e5e5e5' },
    mSection: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK, textTransform: 'uppercase', letterSpacing: 1, marginTop: 10, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: ACCENT, paddingBottom: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    bold: { fontFamily: 'Helvetica-Bold' },
    muted: { color: '#737373' },
    bullet: { flexDirection: 'row', marginTop: 1.5 },
    dot: { width: 3, height: 3, backgroundColor: ACCENT, borderRadius: 2, marginRight: 5, marginTop: 3 },
})

function MBullet({ text }: { text: string }) {
    return <View style={styles.bullet}><View style={styles.dot} /><Text style={{ color: '#404040', flex: 1 }}>{text}</Text></View>
}
// `fmt` used `new Date(d)`, which parses a bare ISO date as UTC midnight - the previous
// month in any negative offset. Both date helpers now come from `lib/resume-links`.

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
                    {/* No ✉ ✆ ⌖ ⌁ ⊕ here any more. `@react-pdf`'s built-in Helvetica is
                        WinAnsi-encoded and has none of those code points, so each one
                        rendered as nothing and left the line starting with a stray space -
                        and "in" before the LinkedIn URL read as a typo rather than a logo.
                        Labels are ASCII; handles replace the full URLs and are clickable. */}
                    {header.email && <Link src={`mailto:${header.email}`} style={styles.sLink}>{header.email}</Link>}
                    {header.phone && <Text style={styles.sContact}>{header.phone}</Text>}
                    {header.location && <Text style={styles.sContact}>{header.location}</Text>}
                    {header.github && <Link src={hrefFor(header.github)} style={styles.sLink}>GitHub: {handleFor(header.github, 'github')}</Link>}
                    {header.linkedin && <Link src={hrefFor(header.linkedin)} style={styles.sLink}>LinkedIn: {handleFor(header.linkedin, 'linkedin')}</Link>}
                    {header.website && <Link src={hrefFor(header.website)} style={styles.sLink}>{handleFor(header.website, 'site')}</Link>}
                    {header.portfolio && <Link src={hrefFor(header.portfolio)} style={styles.sLink}>{handleFor(header.portfolio, 'site')}</Link>}

                    {/* Skills */}
                    {skills.length > 0 && (
                        <>
                            <Text style={styles.sSection}>Skills</Text>
                            {skills.map((g, gi) => (
                                <View key={gi} style={{ marginBottom: 6 }}>
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
                                    <Text style={styles.sContact}>{formatRange(e.startDate, e.endDate)}</Text>
                                </View>
                            ))}
                        </>
                    )}
                </View>

                {/* Main content */}
                <View style={styles.main}>
                    {/* Summary */}
                    {/* One Text per paragraph: `@react-pdf` renders "\n" literally, so each
                        blank line between paragraphs became a full empty line. */}
                    {paragraphsOf(header.summary).length > 0 && (
                        <View style={{ marginBottom: 8, borderLeftWidth: 3, borderLeftColor: ACCENT, paddingLeft: 8 }}>
                            {paragraphsOf(header.summary).map((para, i) => (
                                <Text key={i} style={{ color: '#525252', marginBottom: i === paragraphsOf(header.summary).length - 1 ? 0 : 4 }}>{para}</Text>
                            ))}
                        </View>
                    )}

                    {/* Experience */}
                    {experience.length > 0 && (
                        <View>
                            <Text style={styles.mSection} minPresenceAhead={50}>Experience</Text>
                            {experience.map(e => (
                                <View key={e.id} style={{ marginBottom: 8 }} minPresenceAhead={24}>
                                    <View style={styles.row}>
                                        <Text style={styles.bold}>{e.role}</Text>
                                        <Text style={styles.muted}>{formatRange(e.startDate, e.endDate, e.current)}</Text>
                                    </View>
                                    {e.companyUrl
                                        ? <Link src={hrefFor(e.companyUrl)} style={{ color: ACCENT, marginBottom: 2, textDecoration: 'none' }}>{e.company}</Link>
                                        : <Text style={{ color: ACCENT, marginBottom: 2 }}>{e.company}</Text>}
                                    {e.bullets.filter(b => b.trim()).map((b, i) => <MBullet key={i} text={b} />)}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Projects */}
                    {projects.length > 0 && (
                        <View>
                            <Text style={styles.mSection} minPresenceAhead={50}>Projects</Text>
                            {projects.map(p => (
                                <View key={p.id} style={{ marginBottom: 7 }} minPresenceAhead={24}>
                                    <View style={styles.row}>
                                        <Text style={styles.bold}>{p.name}</Text>
                                        {/* Both links. Only `liveUrl` was printed, so a project
                                            with a repo and no site showed nothing at all. */}
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            {p.github && <Link src={hrefFor(p.github)} style={{ ...styles.muted, textDecoration: 'none' }}>{handleFor(p.github, 'github')}</Link>}
                                            {p.liveUrl && <Link src={hrefFor(p.liveUrl)} style={{ ...styles.muted, textDecoration: 'none' }}>{handleFor(p.liveUrl, 'site')}</Link>}
                                        </View>
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
                                    {p.bullets.filter(b => b.trim()).map((b, i) => <MBullet key={i} text={b} />)}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </Page>
        </Document>
    )
}
