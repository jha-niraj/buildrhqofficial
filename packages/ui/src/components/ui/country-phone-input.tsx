"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "./command";

export interface Country {
    code: string;   // ISO-2: "NP"
    name: string;   // "Nepal"
    dial: string;   // "+977"
    flag: string;   // "🇳🇵"
}

// Priority countries (shown first, Nepal default)
const PRIORITY_CODES = ["NP", "IN", "AE", "QA", "SA", "KW", "BH", "OM", "US", "GB", "AU", "CA", "MY", "SG"];

export const COUNTRIES: Country[] = [
    // South Asia
    { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵" },
    { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
    { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
    { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
    { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
    { code: "BT", name: "Bhutan", dial: "+975", flag: "🇧🇹" },
    // Gulf / Middle East
    { code: "AE", name: "UAE", dial: "+971", flag: "🇦🇪" },
    { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
    { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
    { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
    { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭" },
    { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
    // North America
    { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
    { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
    { code: "MX", name: "Mexico", dial: "+52", flag: "🇲🇽" },
    // Europe
    { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
    { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
    { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
    { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
    { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
    { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
    { code: "CH", name: "Switzerland", dial: "+41", flag: "🇨🇭" },
    { code: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪" },
    { code: "NO", name: "Norway", dial: "+47", flag: "🇳🇴" },
    { code: "DK", name: "Denmark", dial: "+45", flag: "🇩🇰" },
    { code: "FI", name: "Finland", dial: "+358", flag: "🇫🇮" },
    { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹" },
    // Oceania
    { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
    { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿" },
    // SE Asia
    { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
    { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
    { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭" },
    { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩" },
    { code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭" },
    { code: "VN", name: "Vietnam", dial: "+84", flag: "🇻🇳" },
    // East Asia
    { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
    { code: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷" },
    { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
    // Africa
    { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
    { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
    { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪" },
    { code: "ET", name: "Ethiopia", dial: "+251", flag: "🇪🇹" },
    // South America
    { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
    { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
    { code: "CO", name: "Colombia", dial: "+57", flag: "🇨🇴" },
];

export function getDefaultCountry(): Country {
    return COUNTRIES.find(c => c.code === "NP")!;
}

export function buildE164(country: Country, localNumber: string): string {
    const digits = localNumber.replace(/\D/g, "");
    if (!digits) return "";
    return `${country.dial}${digits}`;
}

// ─── Country Selector (dropdown only) ────────────────────────────────────────

interface CountrySelectorProps {
    value: Country;
    onChange: (country: Country) => void;
    disabled?: boolean;
    className?: string;
}

export function CountrySelector({ value, onChange, disabled, className }: CountrySelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const priorityList = useMemo(() =>
        PRIORITY_CODES.map(c => COUNTRIES.find(x => x.code === c)!).filter(Boolean),
        []
    );

    const otherList = useMemo(() =>
        COUNTRIES.filter(c => !PRIORITY_CODES.includes(c.code))
            .filter(c => {
                if (!search) return true;
                const q = search.toLowerCase();
                return c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q);
            })
            .sort((a, b) => a.name.localeCompare(b.name)),
        [search]
    );

    const filteredPriority = useMemo(() =>
        priorityList.filter(c => {
            if (!search) return true;
            const q = search.toLowerCase();
            return c.name.toLowerCase().includes(q) || c.dial.includes(q);
        }),
        [priorityList, search]
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    disabled={disabled}
                    className={cn(
                        "flex h-11 items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed",
                        className
                    )}
                >
                    <span className="text-base leading-none">{value.flag}</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">{value.dial}</span>
                    <ChevronsUpDown className="h-3 w-3 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
                <Command shouldFilter={false}>
                    {/* CommandInput provides native keyboard nav (↑↓ Enter Escape) via cmdk */}
                    <CommandInput
                        placeholder="Search country or code…"
                        value={search}
                        onValueChange={setSearch}
                        className="h-9"
                    />
                    <CommandList className="max-h-60">
                        <CommandEmpty>No country found.</CommandEmpty>
                        {filteredPriority.length > 0 && (
                            <CommandGroup heading="Common">
                                {filteredPriority.map(country => (
                                    <CommandItem
                                        key={country.code}
                                        value={country.code}
                                        onSelect={() => { onChange(country); setOpen(false); setSearch(""); }}
                                        className="flex items-center gap-2.5 cursor-pointer"
                                    >
                                        <span className="text-base">{country.flag}</span>
                                        <span className="flex-1 text-sm">{country.name}</span>
                                        <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{country.dial}</span>
                                        {value.code === country.code && <Check className="h-3.5 w-3.5 text-neutral-500 ml-1" />}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                        {otherList.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="All countries">
                                    {otherList.map(country => (
                                        <CommandItem
                                            key={country.code}
                                            value={country.code}
                                            onSelect={() => { onChange(country); setOpen(false); setSearch(""); }}
                                            className="flex items-center gap-2.5 cursor-pointer"
                                        >
                                            <span className="text-base">{country.flag}</span>
                                            <span className="flex-1 text-sm">{country.name}</span>
                                            <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{country.dial}</span>
                                            {value.code === country.code && <Check className="h-3.5 w-3.5 text-neutral-500 ml-1" />}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ─── Combined input (selector + number field) ─────────────────────────────────

interface CountryPhoneInputProps {
    value?: string;                 // full E.164 number (controlled)
    onChange?: (e164: string) => void;  // fires with full E.164
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    inputClassName?: string;
    defaultCountryCode?: string;    // ISO-2, defaults to "NP"
    lockedCountryCode?: string;     // ISO-2; when set, the dial code is fixed (school country)
}

export function CountryPhoneInput({
    value,
    onChange,
    placeholder = "98XXXXXXXX",
    disabled,
    className,
    inputClassName,
    defaultCountryCode = "NP",
    lockedCountryCode,
}: CountryPhoneInputProps) {
    const initialCode = lockedCountryCode ?? defaultCountryCode;
    const initialCountry = COUNTRIES.find(c => c.code === initialCode) ?? getDefaultCountry();
    const [country, setCountry] = useState<Country>(initialCountry);
    const [localNumber, setLocalNumber] = useState<string>(() => {
        if (value && value.startsWith(initialCountry.dial)) {
            return value.slice(initialCountry.dial.length);
        }
        return value ?? "";
    });

    // Keep the country locked to the school's country when provided.
    useEffect(() => {
        if (!lockedCountryCode) return;
        const c = COUNTRIES.find(x => x.code === lockedCountryCode);
        if (c && c.code !== country.code) setCountry(c);
    }, [lockedCountryCode, country.code]);

    // Sync the local number when an external value arrives (e.g. async prefill in edit mode).
    useEffect(() => {
        const dial = country.dial;
        if (value && value.startsWith(dial)) {
            const local = value.slice(dial.length);
            setLocalNumber(prev => (prev === local ? prev : local));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleCountryChange = (c: Country) => {
        setCountry(c);
        const e164 = buildE164(c, localNumber);
        onChange?.(e164);
    };

    const handleNumberChange = (raw: string) => {
        // Strip non-digits but allow leading spaces for UX
        const cleaned = raw.replace(/[^\d\s\-()]/g, "");
        setLocalNumber(cleaned);
        const e164 = buildE164(country, cleaned);
        onChange?.(e164);
    };

    return (
        <div className={cn("flex gap-2", className)}>
            {lockedCountryCode ? (
                <div
                    aria-label={`Country ${country.name}`}
                    title={`Locked to ${country.name}`}
                    className="flex h-11 items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-100 px-3 text-sm select-none dark:border-neutral-800 dark:bg-neutral-800/60"
                >
                    <span className="text-base leading-none">{country.flag}</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">{country.dial}</span>
                </div>
            ) : (
                <CountrySelector
                    value={country}
                    onChange={handleCountryChange}
                    disabled={disabled}
                />
            )}
            <input
                type="tel"
                value={localNumber}
                onChange={e => handleNumberChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    "flex h-11 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm placeholder:text-neutral-600 dark:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/20 dark:border-neutral-800 dark:bg-neutral-900 dark:placeholder:text-neutral-600 dark:focus:border-neutral-500 disabled:opacity-50",
                    inputClassName
                )}
            />
        </div>
    );
}
