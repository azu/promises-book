<?xml version="1.0" encoding="UTF-8"?>
<!--
  Generates an XHTML document from a DocBook XML document using the DocBook XSL stylesheets.
  See http://docbook.sourceforge.net/release/xsl/1.79.1/doc/xhtml for all parameters.
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <!--
    The absolute URL imports point to system-wide locations by way of this /etc/xml/catalog entry:
  
      <rewriteURI
        uriStartString="https://cdn.docbook.org/release/xsl/current"
        rewritePrefix="file:///usr/share/sgml/docbook/xsl-stylesheets-%docbook-style-xsl-version%"/>
  
    %docbook-style-xsl-version% represents the version installed on the system.
  -->
  <xsl:import href="https://cdn.docbook.org/release/xsl/current/xhtml/docbook.xsl"/>
  <xsl:import href="common.xsl"/>
  <xsl:import href="highlight.xsl"/>
  <xsl:import href="callouts.xsl"/>

  <!--
    AsciiDoc compat
  -->

  <xsl:template match="processing-instruction('asciidoc-br')">
    <br/>
  </xsl:template>

  <xsl:template match="processing-instruction('asciidoc-hr')">
    <hr/>
  </xsl:template>

  <xsl:template match="processing-instruction('asciidoc-pagebreak')">
    <div style="page-break-after: always"></div>
  </xsl:template>
</xsl:stylesheet>
