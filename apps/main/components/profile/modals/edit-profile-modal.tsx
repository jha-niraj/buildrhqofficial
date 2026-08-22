"use client";

import { useState, useRef, useEffect } from "react";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Label } from "@repo/ui/components/ui/label";
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from "@repo/ui/components/ui/tabs";
import {
    User, Camera, MapPin, Globe, Loader2, Check, Sparkles,
    Building, Target, X, Plus
} from "lucide-react";
import toast from "@repo/ui/components/ui/sonner";
import { useUserStore } from "@/app/store/useUserStore";
import { updateProfileSettings } from "@/actions/(main)/user/profile.action";
import { getCompanies } from "@/actions/(main)/user/college.action";
import Image from "next/image";
import { cn } from "@repo/ui/lib/utils";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@repo/ui/components/ui/select";
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/components/ui/command";
import {
    Popover, PopoverContent, PopoverTrigger
} from "@repo/ui/components/ui/popover";
import { Badge } from "@repo/ui/components/ui/badge";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: string;
        name: string | null;
        username: string | null;
        image: string | null;
        bio: string | null;
        location: string | null;
        company: string | null;
        occupation: string | null;
        website: string | null;
        userProfile?: {
            coverGradient: string | null;
            tagline: string | null;
            theme: string;
        } | null;
        careerGoals?: string[];
        targetCompanies?: string[];
        expectedSalary?: string | null;
        noticePeriod?: string | null;
        workExperience?: string | null;
        semester?: string | null;
        university?: string | null;
    };
    onUpdate?: () => void;
}

// Theme options (reserved for future use)
const _THEME_OPTIONS = [
    { id: "OCEAN_BLUE", name: "Ocean Blue", gradient: "from-neutral-800 via-neutral-900 to-neutral-800" },
    { id: "SUNSET_ORANGE", name: "Sunset", gradient: "from-neutral-900 via-neutral-900 to-neutral-800" },
    { id: "FOREST_GREEN", name: "Forest", gradient: "from-neutral-800 via-neutral-900 to-neutral-800" },
    { id: "PURPLE_DREAM", name: "Purple Dream", gradient: "from-neutral-800 via-neutral-900 to-pink-400" },
    { id: "DARK_MODE", name: "Dark", gradient: "from-gray-800 via-gray-700 to-gray-600" },
];

const _SEMESTERS = [
    "1st Semester", "2nd Semester", "3rd Semester", "4th Semester",
    "5th Semester", "6th Semester", "7th Semester", "8th Semester",
    "Graduate", "Post-Graduate", "Other"
];

const JOB_PREFERENCES = [
    { id: 'frontend', label: 'Frontend Developer' },
    { id: 'backend', label: 'Backend Developer' },
    { id: 'fullstack', label: 'Full Stack Developer' },
    { id: 'mobile', label: 'Mobile Developer' },
    { id: 'data-science', label: 'Data Scientist' },
    { id: 'ml-engineer', label: 'ML Engineer' },
    { id: 'devops', label: 'DevOps Engineer' },
    { id: 'other', label: 'Other' },
];

const WORK_EXPERIENCE = [
    "Fresher (0 years)",
    "0-1 years",
    "1-2 years",
    "2-3 years",
    "3-5 years",
    "5+ years"
];

const NOTICE_PERIODS = [
    "Immediate",
    "15 days",
    "1 month",
    "2 months",
    "3 months",
    "Serving Notice"
];

export function EditProfileModal({
    isOpen,
    onClose,
    user,
    onUpdate,
}: EditProfileModalProps) {
    const { updateUser } = useUserStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: user.name || "",
        bio: user.bio || "",
        tagline: user.userProfile?.tagline || "",
        location: user.location || "",
        company: user.company || "",
        occupation: user.occupation || "",
        website: user.website || "",
        theme: user.userProfile?.theme || "OCEAN_BLUE",
        careerGoals: user.careerGoals?.[0] || "",
        targetCompanies: user.targetCompanies || [] as string[],
        expectedSalary: user.expectedSalary || "",
        noticePeriod: user.noticePeriod || "",
        workExperience: user.workExperience || "",
    });

    const [companies, setCompanies] = useState<string[]>([]);
    const [openCompanyPicker, setOpenCompanyPicker] = useState(false);
    const [companyInput, setCompanyInput] = useState("");

    // useEffect, not useState.
    //
    // This was `useState(() => { getCompanies().then(...) })` - useState's initializer used as
    // a lifecycle hook. That runs DURING render, so a server action was dispatched mid-render
    // and its `setCompanies` resolved while React was still rendering. React said so plainly:
    // "Cannot update a component (Router) while rendering a different component
    // (EditProfileModal)". Dispatching a server action during render also nudges the router,
    // which is where the `Router` in that message comes from.
    //
    // An empty dep array is correct here: the list is a static set of companies, so it is
    // fetched once per mount and never refetched.
    useEffect(() => {
        let cancelled = false;
        getCompanies().then((result) => {
            if (!cancelled && result.success) setCompanies(result.companies);
        });
        return () => { cancelled = true };
    }, []);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const addCompany = (company: string) => {
        if (company && !formData.targetCompanies?.includes(company)) {
            setFormData(prev => ({
                ...prev,
                targetCompanies: [...prev.targetCompanies, company]
            }));
            setCompanyInput('');
        }
    };

    const removeCompany = (company: string) => {
        setFormData(prev => ({
            ...prev,
            targetCompanies: prev.targetCompanies?.filter(c => c !== company)
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Update basic profile info via store
            await updateUser({
                name: formData.name,
                bio: formData.bio,
                location: formData.location,
                company: formData.company,
                occupation: formData.occupation,
                website: formData.website,
                careerGoals: formData.careerGoals ? [formData.careerGoals] : [],
                targetCompanies: formData.targetCompanies,
                expectedSalary: formData.expectedSalary,
                noticePeriod: formData.noticePeriod,
                workExperience: formData.workExperience,
            });

            // Update profile settings (tagline, theme)
            const profileResult = await updateProfileSettings({
                tagline: formData.tagline,
                theme: formData.theme as "OCEAN_BLUE" | "SUNSET_ORANGE" | "FOREST_GREEN" | "PURPLE_DREAM" | "DARK_MODE",
            });

            if (!profileResult.success) {
                throw new Error(profileResult.error);
            }

            toast.success("Profile updated successfully!");
            onUpdate?.();
            onClose();
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0 flex flex-col">
                <div className="w-full flex flex-col h-full">
                <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <SheetTitle className="text-xl font-semibold flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Edit Profile
                    </SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto flex-1">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full justify-start px-6 pt-2 bg-transparent border-b rounded-none h-auto gap-4 sticky top-0 bg-background z-10">
                            <TabsTrigger
                                value="basic"
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
                            >
                                Basic Info
                            </TabsTrigger>
                            <TabsTrigger
                                value="career"
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
                            >
                                Career Goals
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="basic" className="px-6 py-4 space-y-5 mt-0">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-background shadow-lg">
                                        <Image
                                            src={user.image || "/default-avatar.png"}
                                            alt="Avatar"
                                            width={80}
                                            height={80}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full shadow-md"
                                        onClick={() => avatarInputRef.current?.click()}
                                    >
                                        <Camera className="w-3.5 h-3.5" />
                                    </Button>
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={() => toast.info("Avatar upload coming soon!")}
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium">{user.name || "Your Name"}</h3>
                                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="Your display name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tagline" className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    Tagline
                                </Label>
                                <Input
                                    id="tagline"
                                    value={formData.tagline}
                                    onChange={(e) => handleChange("tagline", e.target.value)}
                                    placeholder="A short tagline that appears below your name"
                                    maxLength={100}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {formData.tagline.length}/100 characters
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={formData.bio}
                                    onChange={(e) => handleChange("bio", e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                    maxLength={500}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {formData.bio.length}/500 characters
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location" className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Location
                                    </Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => handleChange("location", e.target.value)}
                                        placeholder="City, Country"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website" className="flex items-center gap-2">
                                        <Globe className="w-4 h-4" />
                                        Website
                                    </Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => handleChange("website", e.target.value)}
                                        placeholder="https://yourwebsite.com"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="career" className="px-6 py-4 space-y-5 mt-0">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Dream Job
                                </Label>
                                <Select
                                    value={formData.careerGoals}
                                    onValueChange={(val) => handleChange("careerGoals", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your target role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {
                                            JOB_PREFERENCES.map((job) => (
                                                <SelectItem key={job.id} value={job.id}>{job.label}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Total Experience</Label>
                                    <Select
                                        value={formData.workExperience}
                                        onValueChange={(val) => handleChange("workExperience", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select experience" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {
                                                WORK_EXPERIENCE.map((exp) => (
                                                    <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Expected Salary (LPA)</Label>
                                    <Input
                                        value={formData.expectedSalary}
                                        onChange={(e) => handleChange("expectedSalary", e.target.value)}
                                        placeholder="e.g. 8-12 LPA"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Notice Period</Label>
                                <Select
                                    value={formData.noticePeriod}
                                    onValueChange={(val) => handleChange("noticePeriod", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select notice period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {
                                            NOTICE_PERIODS.map((period) => (
                                                <SelectItem key={period} value={period}>{period}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Building className="w-4 h-4" />
                                    Target Companies
                                </Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {
                                        formData.targetCompanies?.map((company) => (
                                            <Badge key={company} variant="secondary" className="gap-1 pl-2 pr-1">
                                                {company}
                                                <button
                                                    onClick={() => removeCompany(company)}
                                                    className="hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))
                                    }
                                </div>
                                <Popover open={openCompanyPicker} onOpenChange={setOpenCompanyPicker}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between"
                                        >
                                            {companyInput || "Add a target company..."}
                                            <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start" portal={false}>
                                        <Command>
                                            <CommandInput
                                                placeholder="Search company..."
                                                value={companyInput}
                                                onValueChange={setCompanyInput}
                                            />
                                            <CommandEmpty className="p-2">
                                                <button
                                                    onClick={() => {
                                                        addCompany(companyInput);
                                                        setOpenCompanyPicker(false);
                                                    }}
                                                    className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                                                >
                                                    Add &quot;{companyInput}&quot;
                                                </button>
                                            </CommandEmpty>
{/* CommandList, not `overflow-auto` on the group.
                                            cmdk owns the scroll VIEWPORT and it is
                                            Command.List - it is what it scrolls into view
                                            on arrow-key navigation, and what it measures.
                                            Putting the height cap on CommandGroup instead
                                            gave a box with a visible scrollbar that did
                                            not respond to the wheel, because the element
                                            cmdk manages was not the element being
                                            clipped. */}
                                            <CommandList className="max-h-64">
                                            <CommandGroup>
                                                {
                                                    companies
                                                        .filter(company => !formData.targetCompanies?.includes(company))
                                                        .map((company) => (
                                                            <CommandItem
                                                                key={company}
                                                                value={company}
                                                                onSelect={(currentValue) => {
                                                                    addCompany(currentValue);
                                                                    setOpenCompanyPicker(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.targetCompanies?.includes(company) ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {company}
                                                            </CommandItem>
                                                        ))
                                                }
                                            </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/30 shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {
                            isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )
                        }
                    </Button>
                </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}