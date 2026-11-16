/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { Renderer } from "@freelensapp/extensions";
// The "vpn_key" icon of Material Icons, https://github.com/google/material-design-icons, Apache License 2.0.
import svgIcon from "./vals.svg?raw";

const {
  Component: { Icon },
} = Renderer;

export function ValsIcon(props: Renderer.Component.IconProps) {
  return <Icon {...props} svg={svgIcon} />;
}
