import {
    Document, Page, Text, View, Link, StyleSheet
} from '@react-pdf/renderer'
import { ResumeDraftContent } from '@/types/resume-draft'
import { handleFor, hrefFor, paragraphsOf, formatRange } from '@/lib/resume-links'

const ACCENT = '#171717'

const styles = StyleSheet.create({
    // `lineHeight` on the page, so every Text inherits one value instead of each block
    // picking its own. Without it the default leading is loose enough that a four-line
    // bullet reads as four separate sentences.
    page: { fontFamily: 'Helvetica', fontSize: 9, lineHeight: 1.35, color: '#1a1a1a', paddingHorizontal: 40, paddingVertical: 36 },
    // Explicit `lineHeight` on both, because the page now sets one and a 22pt name
    // inheriting the body's 1.35 gets a line box shorter than its own glyphs - the title
    // rode up into the name. Display type needs its leading set with its size.
    name: { fontSize: 22, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5, lineHeight: 1.2 },
    title: { fontSize: 11, color: '#555', lineHeight: 1.3, marginTop: 3, marginBottom: 6 },
    contact: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, fontSize: 8, color: '#555', marginBottom: 12, borderBottomWidth: 1.5, borderBottomColor: ACCENT, paddingBottom: 8 },
    contactItem: { color: '#555', textDecoration: 'none' },
    sectionHeader: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: ACCENT, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 10, marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#ddd', paddingBottom: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    bold: { fontFamily: 'Helvetica-Bold' },
    muted: { color: '#666' },
    link: { color: '#666', textDecoration: 'none' },
    dot: { width: 2.5, marginRight: 5, marginTop: 4, height: 2.5, backgroundColor: '#999', borderRadius: 1.5 },
    skillGroup: { marginBottom: 3 },
    summaryPara: { color: '#444', marginBottom: 4 },
})

function Bullet({ text }: { text: string }) {
    return (
        // `wrap={false}` would push a long bullet whole onto the next page, which is worse
        // than splitting it, so bullets DO wrap - only the entry header is kept with its
        // first line, via `minPresenceAhead` on the entry below.
        <View style={{ flexDirection: 'row', marginTop: 1.5 }}>
            <View style={styles.dot} />
            <Text style={{ flex: 1, color: '#333' }}>{text}</Text>
        </View>
    )
}

/**
 * A section heading plus its content.
 *
 * `minPresenceAhead` is the fix for the orphan in the reported PDF: "PROJECTS" printed at
 * the bottom of page 1 with every project on page 2. It tells the layout engine to require
 * 60pt of room below the heading, and to move the heading to the next page if there is not
 * that much - so a heading is never the last thing on a page.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View>
            <Text style={styles.sectionHeader} minPresenceAhead={60}>{title}</Text>
            {children}
        </View>
    )
}

/** A contact line: the handle, linked, rather than the raw URL as dead text. */
function Contact({ text, href }: { text: string; href?: string }) {
    if (!text) return null
    if (!href) return <Text style={styles.contactItem}>{text}</Text>
    return <Link src={href} style={styles.contactItem}>{text}</Link>
}

export function CleanMinimalTemplate({ content }: { content: ResumeDraftContent }) {
    const { header, experience, projects, education, skills, certifications } = content
    const summary = paragraphsOf(header.summary)

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.name}>{header.name}</Text>
                {header.title && <Text style={styles.title}>{header.title}</Text>}

                {/* Handles, and real link annotations. The previous version printed
                    "https://linkedin.com/in/nirajjha31" and "https://github.com/jha-niraj"
                    as plain text: they wrapped the contact row onto a second line, took
                    more width than the name, and a reader could not click any of them -
                    the generated file contained zero /URI annotations. */}
                <View style={styles.contact}>
                    <Contact text={header.email ?? ''} href={header.email ? `mailto:${header.email}` : undefined} />
                    <Contact text={header.phone ?? ''} href={header.phone ? `tel:${header.phone.replace(/[^+\d]/g, '')}` : undefined} />
                    <Contact text={header.location ?? ''} />
                    <Contact text={handleFor(header.github, 'github')} href={hrefFor(header.github) || undefined} />
                    <Contact text={handleFor(header.linkedin, 'linkedin')} href={hrefFor(header.linkedin) || undefined} />
                    <Contact text={handleFor(header.website, 'site')} href={hrefFor(header.website) || undefined} />
                    <Contact text={handleFor(header.portfolio, 'site')} href={hrefFor(header.portfolio) || undefined} />
                </View>

                {/* One Text per paragraph. `@react-pdf` renders "\n" literally, so the blank
                    line between two paragraphs became a full empty line - three of them cost
                    about 60pt and pushed the whole resume onto a second page. */}
                {summary.length > 0 && (
                    <Section title="Summary">
                        {summary.map((para, i) => (
                            <Text key={i} style={styles.summaryPara}>{para}</Text>
                        ))}
                    </Section>
                )}

                {experience.length > 0 && (
                    <Section title="Experience">
                        {experience.map(e => (
                            <View key={e.id} style={{ marginBottom: 7 }} minPresenceAhead={24}>
                                <View style={styles.row}>
                                    <Text style={styles.bold}>
                                        {e.role}{e.company ? ` - ${e.company}` : ''}
                                    </Text>
                                    <Text style={styles.muted}>{formatRange(e.startDate, e.endDate, e.current)}</Text>
                                </View>
                                {e.companyUrl && (
                                    <Link src={hrefFor(e.companyUrl)} style={{ ...styles.link, fontSize: 8 }}>
                                        {handleFor(e.companyUrl, 'site')}
                                    </Link>
                                )}
                                {e.location && <Text style={{ ...styles.muted, fontSize: 8 }}>{e.location}</Text>}
                                {e.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
                            </View>
                        ))}
                    </Section>
                )}

                {skills.length > 0 && (
                    <Section title="Skills">
                        {skills.map((g, gi) => (
                            <View key={gi} style={styles.skillGroup}>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Text style={{ ...styles.bold, marginRight: 4 }}>{g.category}: </Text>
                                    <Text style={styles.muted}>{g.items.join(' • ')}</Text>
                                </View>
                            </View>
                        ))}
                    </Section>
                )}

                {projects.length > 0 && (
                    <Section title="Projects">
                        {projects.map(p => (
                            <View key={p.id} style={{ marginBottom: 6 }} minPresenceAhead={24}>
                                <View style={styles.row}>
                                    <Text style={styles.bold}>{p.name}</Text>
                                    {/* Both links, not just GitHub. `liveUrl` was collected by
                                        the form, shown in the preview, and then silently
                                        dropped from the PDF that actually gets sent. */}
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        {p.github && (
                                            <Link src={hrefFor(p.github)} style={styles.link}>{handleFor(p.github, 'github')}</Link>
                                        )}
                                        {p.liveUrl && (
                                            <Link src={hrefFor(p.liveUrl)} style={styles.link}>{handleFor(p.liveUrl, 'site')}</Link>
                                        )}
                                    </View>
                                </View>
                                {p.technologies.length > 0 && (
                                    <Text style={{ color: '#666', marginTop: 1 }}>{p.technologies.join(' • ')}</Text>
                                )}
                                {p.description?.trim() && <Text style={{ color: '#444', marginTop: 1 }}>{p.description}</Text>}
                                {p.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
                            </View>
                        ))}
                    </Section>
                )}

                {education.length > 0 && (
                    <Section title="Education">
                        {education.map(e => (
                            <View key={e.id} style={{ marginBottom: 5 }} minPresenceAhead={20}>
                                <View style={styles.row}>
                                    {/* `field` was collected by the form and never printed. */}
                                    <Text style={styles.bold}>
                                        {e.degree
                                            ? `${e.degree}${e.field && !e.degree.toLowerCase().includes(e.field.toLowerCase()) ? `, ${e.field}` : ''}`
                                            : e.institution}
                                    </Text>
                                    <Text style={styles.muted}>{formatRange(e.startDate, e.endDate)}</Text>
                                </View>
                                {e.degree && <Text style={styles.muted}>{e.institution}</Text>}
                                {e.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
                            </View>
                        ))}
                    </Section>
                )}

                {certifications.length > 0 && (
                    <Section title="Certifications">
                        {certifications.map(c => (
                            <View key={c.id} style={{ flexDirection: 'row', marginBottom: 2 }}>
                                <Text style={styles.bold}>{c.name}</Text>
                                {c.issuer && <Text style={styles.muted}> - {c.issuer}{c.date ? `, ${formatRange(c.date)}` : ''}</Text>}
                            </View>
                        ))}
                    </Section>
                )}
            </Page>
        </Document>
    )
}
