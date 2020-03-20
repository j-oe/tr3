<xsl:stylesheet version="2.0" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
	xmlns:tr3="http://www.hs-karlsruhe.de/kmm-m/tr3">
	<xsl:output method="xml" encoding="UTF-8" indent="yes"/>

	<!-- RDF base URL as universal namespace -->
	<xsl:param name="tr3">http://www.hs-karlsruhe.de/kmm-m/tr3/</xsl:param>

	<!-- options -->
	<xsl:param name="omit.origin" select="0" />

	<xsl:template match="tr3:tr3 | tr3:branch">
		<rdf:RDF>
			<!-- for universal identifiers concat base URL and ID -->
			<rdf:Description rdf:about="{concat($tr3,'node','#',@id)}">
				<xsl:variable name="node" select="@id" />

				<!-- title attribute only if element is tr3 (root) -->
				<xsl:if test="local-name(.) = 'tr3'">
					<tr3:title><xsl:value-of select="@title" /></tr3:title>
				</xsl:if>
				<!-- content attribute only if it has content -->
				<xsl:if test="@content and @content != ''">
					<!-- reference to real resource -->
					<tr3:content rdf:resource="{concat($tr3, @content)}" />
				</xsl:if>
				<!-- class attribute only if it has content -->
				<xsl:if test="@class and @class != ''">
					<tr3:class><xsl:value-of select="@class" /></tr3:class>
				</xsl:if>
				<!-- origin attribute only if exitent and should not be omitted -->
				<xsl:if test="@origin and @origin != '' and $omit.origin = 1">
					<!-- reference to origin node -->
					<tr3:origin rdf:resource="{concat($tr3,'node','#', @origin)}" />
				</xsl:if>

				<!-- out attribute  -->
				<tr3:out><xsl:value-of select="@out" /></tr3:out>
				<tr3:answers>
					<!-- rdf-implemented list of alternatives 'rdf:alt' -->
					<rdf:alt>
						<!-- generate 'rdf:li' for each possible answer -->
						<xsl:for-each select="tr3:branch | tr3:leaf">
							<rdf:li rdf:resource="{concat($tr3,'connection','#', @in, '-', @id)}"></rdf:li>
						</xsl:for-each>
						<xsl:for-each select="tr3:ref">
							<rdf:li rdf:resource="{concat($tr3,'connection','#', @in, '-', @link)}"></rdf:li>
						</xsl:for-each>
					</rdf:alt>
				</tr3:answers>
			</rdf:Description>
			<!-- generate connection for each child node -->
			<xsl:for-each select="tr3:branch | tr3:leaf | tr3:ref">
				<xsl:call-template name="generateConnection">
					<xsl:with-param name="in" select="@in" />
					<xsl:with-param name="target" select="if (local-name(.) = 'ref') then @link else @id" />
				</xsl:call-template>
			</xsl:for-each>
			<xsl:apply-templates />
		</rdf:RDF>
	</xsl:template>

	<xsl:template match="tr3:leaf">
		<rdf:Description rdf:about="{concat($tr3,'node','#',@id)}">
			<xsl:if test="@content and @content != ''">
				<tr3:content><xsl:value-of select="@content" /></tr3:content>
			</xsl:if>
			<xsl:if test="@class and @class != ''">
				<tr3:class><xsl:value-of select="@class" /></tr3:class>
			</xsl:if>
			<tr3:result><xsl:value-of select="@out" /></tr3:result>
		</rdf:Description>
		<xsl:apply-templates />
	</xsl:template>

	<!-- named template for generting connections -->
	<xsl:template name="generateConnection">
		<xsl:param name="in" />
		<xsl:param name="target" />

		<!-- check preceding axis for duplicates -->
		<xsl:if test="not(preceding::*[@in = $in][@id = $target])">
			<!-- generate connection resource -->
			<xsl:element name="rdf:Description" namespace="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
				<xsl:attribute name="about" select="concat($tr3,'connection','#', $in, '-', $target)" />
				<tr3:in><xsl:value-of select="$in" /></tr3:in>
				<tr3:target rdf:resource="{concat($tr3,'node','#', $target)}" />
			</xsl:element>
		</xsl:if>
	</xsl:template>

</xsl:stylesheet>