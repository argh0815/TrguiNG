/**
 * TrguiNG - next gen remote GUI for transmission torrent daemon
 * Copyright (C) 2023  qu1ck (mail at qu1ck.org)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useCallback, useEffect, useState } from "react";
import type { ColorScheme } from "@mantine/core";
import { Box, Checkbox, Grid, HoverCard, MultiSelect, NativeSelect, NumberInput, Text, Textarea, useMantineTheme } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import ColorChooser from "components/colorchooser";
import { useGlobalStyleOverrides } from "themehooks";
import { DeleteTorrentDataOptions } from "config";
import type { ColorSetting, DeleteTorrentDataOption, StyleOverrides } from "config";
import { ColorSchemeToggle } from "components/miscbuttons";
import { Label } from "./common";
import * as Icon from "react-bootstrap-icons";
const { TAURI, invoke } = await import(/* webpackChunkName: "taurishim" */"taurishim");

export interface InterfaceFormValues {
    interface: {
        theme?: ColorScheme,
        styleOverrides: StyleOverrides,
        skipAddDialog: boolean,
        deleteTorrentData: DeleteTorrentDataOption,
        animatedProgressbars: boolean,
        colorfulProgressbars: boolean,
        numLastSaveDirs: number,
        sortLastSaveDirs: boolean,
        preconfiguredLabels: string[],
        ignoredTrackerPrefixes: string[],
        defaultTrackers: string[],
    },
}

export function InterfaceSettigsPanel<V extends InterfaceFormValues>(props: { form: UseFormReturnType<V> }) {
    const theme = useMantineTheme();
    const { style, setStyle } = useGlobalStyleOverrides();
    const [systemFonts, setSystemFonts] = useState<string[]>(["Default"]);

    useEffect(() => {
        if (TAURI) {
            invoke<string[]>("list_system_fonts").then((fonts) => {
                fonts.sort();
                setSystemFonts(["Default"].concat(fonts));
            }).catch(console.error);
        } else {
            setSystemFonts(["Default", "Arial", "Verdana", "Tahoma", "Roboto"]);
        }
    }, []);

    const { setFieldValue, setFieldError, clearFieldError } = props.form as unknown as UseFormReturnType<InterfaceFormValues>;

    useEffect(() => {
        setFieldValue("interface.theme", theme.colorScheme);
    }, [setFieldValue, theme]);

    const setTextColor = useCallback((color: ColorSetting | undefined) => {
        const newStyle = { dark: { ...style.dark }, light: { ...style.light }, font: style.font };
        newStyle[theme.colorScheme].color = color;
        setStyle(newStyle);
        setFieldValue("interface.styleOverrides", newStyle);
    }, [style, theme.colorScheme, setStyle, setFieldValue]);

    const setBgColor = useCallback((backgroundColor: ColorSetting | undefined) => {
        const newStyle = { dark: { ...style.dark }, light: { ...style.light }, font: style.font };
        newStyle[theme.colorScheme].backgroundColor = backgroundColor;
        setStyle(newStyle);
        setFieldValue("interface.styleOverrides", newStyle);
    }, [style, theme.colorScheme, setStyle, setFieldValue]);

    const setFont = useCallback((font: string) => {
        const newStyle = {
            dark: { ...style.dark },
            light: { ...style.light },
            font: font === "Default" ? undefined : font,
        };
        setStyle(newStyle);
        setFieldValue("interface.styleOverrides", newStyle);
    }, [style, setStyle, setFieldValue]);

    const defaultColor = theme.colorScheme === "dark"
        ? { color: "dark", shade: 0, computed: theme.colors.dark[0] }
        : { color: "dark", shade: 9, computed: theme.colors.dark[9] };

    const defaultBg = theme.colorScheme === "dark"
        ? { color: "dark", shade: 7, computed: theme.colors.dark[7] }
        : { color: "gray", shade: 0, computed: theme.colors.gray[0] };

    const setPreconfiguredLabels = useCallback((labels: string[]) => {
        setFieldValue("interface.preconfiguredLabels", labels);
    }, [setFieldValue]);

    const setIgnoredTrackerPrefixes = useCallback((prefixes: string[]) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _ = new RegExp(`^(?<prefix>(${prefixes.join("|")})\\d*)\\.[^.]+\\.[^.]+$`, "i");
            setFieldValue("interface.ignoredTrackerPrefixes", prefixes);
            clearFieldError("interface.ignoredTrackerPrefixes");
        } catch (SyntaxError) {
            setFieldError("interface.ignoredTrackerPrefixes", "Invalid regex");
        }
    }, [setFieldValue, setFieldError, clearFieldError]);

    return (
        <Grid align="center">
            <Grid.Col span={1}>
                <ColorSchemeToggle />
            </Grid.Col>
            <Grid.Col span={1}>
                Font
            </Grid.Col>
            <Grid.Col span={4}>
                <NativeSelect data={systemFonts} value={style.font} onChange={(e) => { setFont(e.currentTarget.value); }} />
            </Grid.Col>
            <Grid.Col span={2}>
                Text color
            </Grid.Col>
            <Grid.Col span={1}>
                <ColorChooser value={style[theme.colorScheme].color ?? defaultColor} onChange={setTextColor} />
            </Grid.Col>
            <Grid.Col span={2}>
                Background
            </Grid.Col>
            <Grid.Col span={1}>
                <ColorChooser value={style[theme.colorScheme].backgroundColor ?? defaultBg} onChange={setBgColor} />
            </Grid.Col>
            <Grid.Col span={3}>
                Delete torrent data
            </Grid.Col>
            <Grid.Col span={3}>
                <NativeSelect data={DeleteTorrentDataOptions as unknown as string[]}
                    value={props.form.values.interface.deleteTorrentData}
                    onChange={(e) => { setFieldValue("interface.deleteTorrentData", e.target.value); }} />
            </Grid.Col>
            <Grid.Col span={6}>
                <Checkbox label="Skip add torrent dialog"
                    {...props.form.getInputProps("interface.skipAddDialog", { type: "checkbox" })} />
            </Grid.Col>
            <Grid.Col span={4}>Max number of saved download directories</Grid.Col>
            <Grid.Col span={2}>
                <NumberInput
                    min={1}
                    max={100}
                    {...props.form.getInputProps("interface.numLastSaveDirs")} />
            </Grid.Col>
            <Grid.Col span={6}>
                <Checkbox label="Sort download directories list"
                    {...props.form.getInputProps("interface.sortLastSaveDirs", { type: "checkbox" })} />
            </Grid.Col>
            <Grid.Col span={3}>Progress bars</Grid.Col>
            <Grid.Col span={3}>
                <Checkbox label="Colorful"
                    {...props.form.getInputProps("interface.colorfulProgressbars", { type: "checkbox" })} />
            </Grid.Col>
            <Grid.Col span={3}>
                <Checkbox label="Animated"
                    {...props.form.getInputProps("interface.animatedProgressbars", { type: "checkbox" })} />
            </Grid.Col>
            <Grid.Col>
                <MultiSelect
                    data={props.form.values.interface.preconfiguredLabels}
                    value={props.form.values.interface.preconfiguredLabels}
                    onChange={setPreconfiguredLabels}
                    label={<Box>
                        <span>Preconfigured labels</span>
                        <HoverCard width={280} shadow="md">
                            <HoverCard.Target>
                                <Icon.Question />
                            </HoverCard.Target>
                            <HoverCard.Dropdown>
                                <Text size="sm">
                                    These labels will always be present in the suggestions list
                                    and filters even if no existing torrents have them.
                                </Text>
                            </HoverCard.Dropdown>
                        </HoverCard>
                    </Box>}
                    withinPortal
                    searchable
                    creatable
                    getCreateLabel={(query) => `+ Add ${query}`}
                    onCreate={(query) => {
                        setPreconfiguredLabels([...props.form.values.interface.preconfiguredLabels, query]);
                        return query;
                    }}
                    valueComponent={Label}
                />
            </Grid.Col>
            <Grid.Col>
                <MultiSelect
                    data={props.form.values.interface.ignoredTrackerPrefixes}
                    value={props.form.values.interface.ignoredTrackerPrefixes}
                    onChange={setIgnoredTrackerPrefixes}
                    label={<Box>
                        <span>Ignored tracker prefixes</span>
                        <HoverCard width={380} shadow="md">
                            <HoverCard.Target>
                                <Icon.Question />
                            </HoverCard.Target>
                            <HoverCard.Dropdown>
                                <Text size="sm">
                                    When subdomain of the tracker looks like one of these strings + (optional) digits,
                                    it will be omitted. This affects grouping in filters and display in table columns.
                                    You can use regex here for more advanced filtering, the list will be combined
                                    using &quot;|&quot;.
                                </Text>
                            </HoverCard.Dropdown>
                        </HoverCard>
                    </Box>}
                    withinPortal
                    searchable
                    creatable
                    error={props.form.errors["interface.ignoredTrackerPrefixes"]}
                    getCreateLabel={(query) => `+ Add ${query}`}
                    onCreate={(query) => {
                        setIgnoredTrackerPrefixes([...props.form.values.interface.ignoredTrackerPrefixes, query]);
                        return query;
                    }}
                    valueComponent={Label}
                />
            </Grid.Col>
            <Grid.Col>
                <Textarea minRows={6}
                    label="Default tracker list"
                    value={props.form.values.interface.defaultTrackers.join("\n")}
                    onChange={(e) => {
                        props.form.setFieldValue(
                            "interface.defaultTrackers", e.currentTarget.value.split("\n") as any);
                    }} />
            </Grid.Col>
        </Grid>
    );
}
