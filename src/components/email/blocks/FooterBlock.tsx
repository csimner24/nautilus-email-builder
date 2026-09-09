import * as React from "react";
import { Section, Row, Column, Text, Link, Hr } from "@react-email/components";
import { theme } from "../theme";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterBlockProps {
  companyName?: string;
  address?: string;
  unsubscribeUrl?: string;
  links?: FooterLink[];
  socials?: FooterLink[];
  bgColor?: string;
  textColor?: string;
}

export const footerBlockDefaults = {
  companyName: "Nautilus, Inc.",
  address: "123 Market St, San Francisco, CA 94105",
  unsubscribeUrl: "https://example.com/unsubscribe",
  links: [
    { label: "Home", href: "https://example.com" },
    { label: "Contact", href: "https://example.com/contact" },
    { label: "Privacy", href: "https://example.com/privacy" },
  ],
  socials: [
    { label: "Twitter", href: "https://twitter.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
  ],
  bgColor: theme.color.background,
  textColor: theme.color.textMuted,
} as const satisfies FooterBlockProps;

const linkStyle: React.CSSProperties = {
  ...theme.type.caption,
  color: theme.color.link,
  textDecoration: "none",
  padding: "0 8px",
};

/** Footer: branding, nav/social links, address, and unsubscribe. */
export function FooterBlock({
  companyName = footerBlockDefaults.companyName,
  address = footerBlockDefaults.address,
  unsubscribeUrl = footerBlockDefaults.unsubscribeUrl,
  links = footerBlockDefaults.links,
  socials = footerBlockDefaults.socials,
  bgColor = footerBlockDefaults.bgColor,
  textColor = footerBlockDefaults.textColor,
}: FooterBlockProps) {
  const captionStyle: React.CSSProperties = {
    ...theme.type.caption,
    color: textColor,
    textAlign: "center",
  };

  return (
    <Section
      style={{
        backgroundColor: bgColor,
        padding: `${theme.space[3]} ${theme.space[3]}`,
        textAlign: "center",
      }}
    >
      {links.length > 0 ? (
        <Row>
          <Column style={{ textAlign: "center" }}>
            {links.map((link, index) => (
              <Link key={index} href={link.href} style={linkStyle}>
                {link.label}
              </Link>
            ))}
          </Column>
        </Row>
      ) : null}

      {socials.length > 0 ? (
        <Text style={{ ...captionStyle, margin: `${theme.space[1]} 0 0` }}>
          {socials.map((social, index) => (
            <Link key={index} href={social.href} style={linkStyle}>
              {social.label}
            </Link>
          ))}
        </Text>
      ) : null}

      <Hr
        style={{
          border: "none",
          borderTop: `1px solid ${theme.color.outline}`,
          margin: `${theme.space[2]} 0`,
        }}
      />

      <Text style={{ ...captionStyle, margin: 0 }}>
        {companyName}
        {address ? (
          <>
            <br />
            {address}
          </>
        ) : null}
      </Text>

      {unsubscribeUrl ? (
        <Text style={{ ...captionStyle, margin: `${theme.space[1]} 0 0` }}>
          <Link
            href={unsubscribeUrl}
            style={{
              color: theme.color.textMuted,
              textDecoration: "underline",
            }}
          >
            Unsubscribe
          </Link>
        </Text>
      ) : null}
    </Section>
  );
}
