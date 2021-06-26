<?xml version="1.0" encoding="US-ASCII"?>
<!--This file was created automatically by xsl2profile-->
<!--from the DocBook XSL stylesheets.-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:d="http://docbook.org/ns/docbook"
xmlns:ng="http://docbook.org/docbook-ng" xmlns:db="http://docbook.org/ns/docbook" xmlns:exsl="http://exslt.org/common" xmlns:exslt="http://exslt.org/common" exslt:dummy="dummy" ng:dummy="dummy" db:dummy="dummy" extension-element-prefixes="exslt" version="1.0" exclude-result-prefixes="exsl db ng exslt d">
  
<xsl:import href="../html/chunk.xsl"/>

<!-- ********************************************************************
     $Id: eclipse.xsl 9910 2014-02-24 19:49:36Z bobstayton $
     ********************************************************************

     This file is part of the XSL DocBook Stylesheet distribution.
     See ../README or http://docbook.sf.net/release/xsl/current/ for
     copyright and other information.

     ******************************************************************** -->

<xsl:variable name="with.namespace">
  <xsl:if test="$exsl.node.set.available != 0 and                  namespace-uri(/*) != 'http://docbook.org/ns/docbook'">
      <xsl:apply-templates select="/*" mode="addNS"/>
  </xsl:if>
</xsl:variable>

<xslo:include xmlns:xslo="http://www.w3.org/1999/XSL/Transform" href="../profiling/profile-mode.xsl"/><xslo:variable xmlns:xslo="http://www.w3.org/1999/XSL/Transform" name="profiled-content"><xslo:choose><xslo:when test="$exsl.node.set.available != 0 and                      namespace-uri(/*) != 'http://docbook.org/ns/docbook'"><xslo:variable name="with.namespace"><xslo:apply-templates select="/*" mode="addNS"/></xslo:variable><xslo:call-template name="log.message"><xslo:with-param name="level">Note</xslo:with-param><xslo:with-param name="source"><xslo:call-template name="get.doc.title"/></xslo:with-param><xslo:with-param name="context-desc"><xslo:text>namesp. add</xslo:text></xslo:with-param><xslo:with-param name="message"><xslo:text>added namespace before processing</xslo:text></xslo:with-param></xslo:call-template><xslo:apply-templates select="exslt:node-set($with.namespace)" mode="profile"/></xslo:when><xslo:otherwise><xslo:apply-templates select="/" mode="profile"/></xslo:otherwise></xslo:choose></xslo:variable><xslo:variable xmlns:xslo="http://www.w3.org/1999/XSL/Transform" name="profiled-nodes" select="exslt:node-set($profiled-content)"/><xsl:template match="/">
  <!-- * Get a title for current doc so that we let the user -->
  <!-- * know what document we are processing at this point. -->
  <xsl:variable name="doc.title">
    <xsl:call-template name="get.doc.title"/>
  </xsl:variable>
  <xsl:choose>
    <!-- fix namespace if necessary -->
    <xsl:when test="false()"/>
    <!-- Can't process unless namespace fixed with exsl node-set()-->
    <xsl:when test="false()"/>
    <xsl:otherwise>
      <xsl:choose>
        <xsl:when test="$rootid != ''">
          <xsl:choose>
            <xsl:when test="count($profiled-nodes//*[@id=$rootid or @xml:id=$rootid]) = 0">
              <xsl:message terminate="yes">
                <xsl:text>ID '</xsl:text>
                <xsl:value-of select="$rootid"/>
                <xsl:text>' not found in document.</xsl:text>
              </xsl:message>
            </xsl:when>
            <xsl:otherwise>
              <xsl:if test="$collect.xref.targets = 'yes' or                             $collect.xref.targets = 'only'">
                <xsl:apply-templates select="key('id', $rootid)" mode="collect.targets"/>
              </xsl:if>
              <xsl:if test="$collect.xref.targets != 'only'">
                <xsl:message>Formatting from <xsl:value-of select="$rootid"/></xsl:message>
                <xsl:apply-templates select="$profiled-nodes//*[@id=$rootid or @xml:id=$rootid]" mode="process.root"/>
                <xsl:call-template name="etoc"/>
                <xsl:call-template name="plugin.xml"/>
    				<xsl:call-template name="helpidx"/>
              </xsl:if>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <xsl:if test="$collect.xref.targets = 'yes' or                         $collect.xref.targets = 'only'">
            <xsl:apply-templates select="$profiled-nodes" mode="collect.targets"/>
          </xsl:if>
          <xsl:if test="$collect.xref.targets != 'only'">
            <xsl:apply-templates select="$profiled-nodes" mode="process.root"/>
            <xsl:call-template name="etoc"/>
            <xsl:call-template name="plugin.xml"/>
    		  <xsl:call-template name="helpidx"/>
          </xsl:if>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template name="etoc">
  <xsl:call-template name="write.chunk">
    <xsl:with-param name="filename">
      <xsl:if test="$manifest.in.base.dir != 0">
        <xsl:value-of select="$chunk.base.dir"/>
      </xsl:if>
      <xsl:value-of select="'toc.xml'"/>
    </xsl:with-param>
    <xsl:with-param name="method" select="'xml'"/>
    <xsl:with-param name="encoding" select="'utf-8'"/>
    <xsl:with-param name="indent" select="'yes'"/>
    <xsl:with-param name="quiet" select="$chunk.quietly"/>
    <xsl:with-param name="content">
      <xsl:choose>

        <xsl:when test="$rootid != ''">
          <xsl:variable name="title">
            <xsl:if test="$eclipse.autolabel=1">
              <xsl:variable name="label.markup">
                <xsl:apply-templates select="$profiled-nodes//*[@id=$rootid or @xml:id=$rootid]" mode="label.markup"/>
              </xsl:variable>
              <xsl:if test="normalize-space($label.markup)">
                <xsl:value-of select="concat($label.markup,$autotoc.label.separator)"/>
              </xsl:if>
            </xsl:if>
            <xsl:apply-templates select="$profiled-nodes//*[@id=$rootid or @xml:id=$rootid]" mode="title.markup"/>
          </xsl:variable>
          <xsl:variable name="href">
            <xsl:call-template name="href.target.with.base.dir">
              <xsl:with-param name="object" select="key('id',$rootid)"/>
            </xsl:call-template>
          </xsl:variable>
          
          <toc label="{normalize-space($title)}" topic="{$href}">
            <xsl:apply-templates select="$profiled-nodes//*[@id=$rootid or @xml:id=$rootid]/*" mode="etoc"/>
          </toc>
        </xsl:when>

        <xsl:otherwise>
          <xsl:variable name="title">
            <xsl:if test="$eclipse.autolabel=1">
              <xsl:variable name="label.markup">
                <xsl:apply-templates select="$profiled-nodes/*" mode="label.markup"/>
              </xsl:variable>
              <xsl:if test="normalize-space($label.markup)">
                <xsl:value-of select="concat($label.markup,$autotoc.label.separator)"/>
              </xsl:if>
            </xsl:if>
            <xsl:apply-templates select="$profiled-nodes/*" mode="title.markup"/>
          </xsl:variable>
          <xsl:variable name="href">
            <xsl:call-template name="href.target.with.base.dir">
              <xsl:with-param name="object" select="$profiled-nodes"/>
            </xsl:call-template>
          </xsl:variable>
          
          <toc label="{normalize-space($title)}" topic="{$href}">
            <xsl:apply-templates select="$profiled-nodes/*/*" mode="etoc"/>
          </toc>
        </xsl:otherwise>

      </xsl:choose>
    </xsl:with-param>
  </xsl:call-template>
</xsl:template>

<xsl:template match="d:book|d:part|d:reference|d:preface|d:chapter|d:bibliography|d:appendix|d:article|d:glossary|d:section|d:sect1|d:sect2|d:sect3|d:sect4|d:sect5|d:refentry|d:colophon|d:bibliodiv|d:index" mode="etoc">
  <xsl:variable name="title">
    <xsl:if test="$eclipse.autolabel=1">
      <xsl:variable name="label.markup">
        <xsl:apply-templates select="." mode="label.markup"/>
      </xsl:variable>
      <xsl:if test="normalize-space($label.markup)">
        <xsl:value-of select="concat($label.markup,$autotoc.label.separator)"/>
      </xsl:if>
    </xsl:if>
    <xsl:apply-templates select="." mode="title.markup"/>
  </xsl:variable>

  <xsl:variable name="href">
    <xsl:call-template name="href.target.with.base.dir">
      <xsl:with-param name="context" select="/"/>        <!-- Generate links relative to the location of root file/toc.xml file -->
    </xsl:call-template>
  </xsl:variable>

  <topic label="{normalize-space($title)}" href="{$href}">
    <xsl:apply-templates select="d:part|d:reference|d:preface|d:chapter|d:bibliography|d:appendix|d:article|d:glossary|d:section|d:sect1|d:sect2|d:sect3|d:sect4|d:sect5|d:refentry|d:colophon|d:bibliodiv|d:index" mode="etoc"/>
  </topic>

</xsl:template>

<xsl:template match="text()" mode="etoc"/>

<xsl:template name="plugin.xml">
  <xsl:call-template name="write.chunk">
    <xsl:with-param name="filename">
      <xsl:if test="$manifest.in.base.dir != 0">
        <xsl:value-of select="$chunk.base.dir"/>
      </xsl:if>
      <xsl:value-of select="'plugin.xml'"/>
    </xsl:with-param>
    <xsl:with-param name="method" select="'xml'"/>
    <xsl:with-param name="encoding" select="'utf-8'"/>
    <xsl:with-param name="indent" select="'yes'"/>
    <xsl:with-param name="quiet" select="$chunk.quietly"/>
    <xsl:with-param name="content">
      <plugin name="{$eclipse.plugin.name}" id="{$eclipse.plugin.id}" version="1.0" provider-name="{$eclipse.plugin.provider}">

		  <extension point="org.eclipse.help.toc">
			<toc file="toc.xml" primary="true"/>
		  </extension>
		  <extension point="org.eclipse.help.index">
			<index file="index.xml"/>
		  </extension>
      </plugin>
    </xsl:with-param>
  </xsl:call-template>
</xsl:template>

<!-- ==================================================================== -->
<!-- The following templates come from the javahelp xsls with modifications needed to make them generate and ecilpse index.xml file -->

<xsl:template name="helpidx">
  <xsl:call-template name="write.chunk.with.doctype">
    <xsl:with-param name="filename" select="concat($chunk.base.dir, 'index.xml')"/>
    <xsl:with-param name="method" select="'xml'"/>
    <xsl:with-param name="indent" select="'yes'"/>
    <xsl:with-param name="doctype-public" select="''"/>
    <xsl:with-param name="doctype-system" select="''"/>
    <xsl:with-param name="encoding" select="'utf-8'"/>
    <xsl:with-param name="quiet" select="$chunk.quietly"/>
    <xsl:with-param name="content">
      <xsl:call-template name="helpidx.content"/>
    </xsl:with-param>
  </xsl:call-template>
</xsl:template>

  <xsl:template name="helpidx.content">
	<index>
	  <xsl:choose>
		<xsl:when test="$rootid != ''">
		  <xsl:apply-templates select="key('id',$rootid)//d:indexterm" mode="idx">
			<xsl:sort select="normalize-space(concat(d:primary/@sortas, d:primary[not(@sortas) or @sortas = '']))"/>
			<xsl:sort select="normalize-space(concat(d:secondary/@sortas, d:secondary[not(@sortas) or @sortas = '']))"/>
			<xsl:sort select="normalize-space(concat(d:tertiary/@sortas, d:tertiary[not(@sortas) or @sortas = '']))"/>
		  </xsl:apply-templates>
		</xsl:when>
		<xsl:otherwise>
		  <xsl:apply-templates select="//d:indexterm" mode="idx">
			<xsl:sort select="normalize-space(concat(d:primary/@sortas, d:primary[not(@sortas) or @sortas = '']))"/>
			<xsl:sort select="normalize-space(concat(d:secondary/@sortas, d:secondary[not(@sortas) or @sortas = '']))"/>
			<xsl:sort select="normalize-space(concat(d:tertiary/@sortas, d:tertiary[not(@sortas) or @sortas = '']))"/>
		  </xsl:apply-templates>
		</xsl:otherwise>
	  </xsl:choose>
	</index>
  </xsl:template>
  
  <xsl:template match="d:indexterm[@class='endofrange']" mode="idx"/>
  
  <xsl:template match="d:indexterm|d:primary|d:secondary|d:tertiary" mode="idx">

	<xsl:variable name="href">
	  <xsl:call-template name="href.target.with.base.dir">
		<xsl:with-param name="context" select="/"/>        <!-- Generate links relative to the location of root file/toc.xml file -->
	  </xsl:call-template>
	</xsl:variable>

	<xsl:variable name="text">
	  <xsl:value-of select="normalize-space(.)"/>
	  <xsl:if test="following-sibling::*[1][self::d:see]">
		<xsl:text> (</xsl:text><xsl:call-template name="gentext">
		  <xsl:with-param name="key" select="'see'"/>
		</xsl:call-template><xsl:text> </xsl:text>
		<xsl:value-of select="following-sibling::*[1][self::d:see]"/>)</xsl:if>
	</xsl:variable>
	
	<xsl:choose>
	  <xsl:when test="self::d:indexterm">
		<xsl:apply-templates select="d:primary" mode="idx"/>
	  </xsl:when>
	  <xsl:when test="self::d:primary">
		<entry keyword="{$text}">
		  <topic href="{$href}"/>
		  <xsl:apply-templates select="following-sibling::d:secondary" mode="idx"/>
		</entry>
	  </xsl:when>
	  <xsl:otherwise>
		<entry keyword="{$text}">
		  <topic href="{$href}"/>
		  <xsl:apply-templates select="following-sibling::d:tertiary" mode="idx"/>
		</entry>
	  </xsl:otherwise>
	</xsl:choose>
  </xsl:template>

  <!-- ==================================================================== -->

</xsl:stylesheet>
