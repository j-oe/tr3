<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" encoding="UTF-8" />

	<!--
	this stylesheet has to be applied to an empty xml-document.
	the tgf file will be included via the unparsed-text function.
	path to the tgf-file defined in parameter 'source'
	-->
	<xsl:param name="source">tree3.tgf</xsl:param>

	<!-- read tgf-format -->
	<!-- read file as unparsed text-->
	<xsl:variable name="tgf" select="unparsed-text($source)" />
	<!-- file name as title -->
	<xsl:variable name="tgf.name" select="substring-before($source,'.tgf')" />
	<!-- nodes are before the '#' separator -->
	<xsl:variable name="tgf.nodes" select="substring-before($tgf,'#')" />
	<!-- links are after the '#' separator -->
	<xsl:variable name="tgf.links" select="substring-after($tgf,'#')" />

	<!-- build flat nodes -->
	<xsl:variable name="tgf.structure">
		<structure>
			<!-- start with nodes: split string at line breaks -->
			<xsl:for-each select="tokenize($tgf.nodes,'\n')">
				<!-- nodes are defined by two parts separated by a space char -> 'id'-[space]-'name' --> 
				<!-- id is before first space -->
				<xsl:variable name="node.id" select="substring-before(current(),' ')" />
				<!-- name is everything after first space -->
				<xsl:variable name="node.out" select="substring-after(current(),' ')" /> 
				
				<!-- test for empty values -->				
				<xsl:if test="$node.id != '' and $node.out != ''">
					<node id="{$node.id}" out="{$node.out}" />
				</xsl:if>
			</xsl:for-each>

			<!-- continue with links: split string at line breaks -->
			<xsl:for-each select="tokenize($tgf.links,'\n')">
				<!-- links are defined by three parts separated by space chars -> 'start'-[space]-'end'-[space]-'label' --> 
				<!-- get last two parts after first space char -->
				<xsl:variable name="temp.tail" select="substring-after(current(),' ')" />
				<!-- get first part before first space char -->
				<xsl:variable name="link.start" select="substring-before(current(),' ')" />
				<!-- split second part in last two parts -->
				<xsl:variable name="link.end" select="if (contains($temp.tail,' ')) then substring-before($temp.tail,' ') else $temp.tail" />
				<xsl:variable name="link.label" select="substring-after($temp.tail,' ')" />
				
				<!-- construct link -->
				<xsl:if test="$link.start != '' and $link.end != ''">
					<link start="{$link.start}" end="{$link.end}" label="{$link.label}" />
				</xsl:if>
			</xsl:for-each>
		</structure>
	</xsl:variable>

	<!-- add hierarchical information with parent attribute -->
	<xsl:variable name="tgf.layout">
		<layout>
			<xsl:for-each select="$tgf.structure//node">
				<xsl:variable name="node.id" select="@id" />
				<xsl:variable name="node.out" select="@out" />
				<!-- get parent attribute by comparing start and end attributes of links --> 
				<xsl:variable name="node.parent" select="$tgf.structure//link[@end=$node.id]/@start" />
				<!-- generate node -->
				<node id="{$node.id}" out="{$node.out}" parent="{if ($node.parent != '') then $node.parent else 'root'}"/>
			</xsl:for-each>
		</layout>
	</xsl:variable>

	<!-- start to build tree -->
	<xsl:template match="/">
		<tr3 title="{$tgf.name}" out="{$tgf.layout//node[@parent='root']/@out}">
			<!-- first call of recursive template 'buildTree' with root node as argument -->
			<xsl:call-template name="buildTree">
				<xsl:with-param name="node" select="$tgf.layout//node[@parent='root']" />
			</xsl:call-template>
		</tr3>
	</xsl:template>

	<!-- build tree based on parent attribute and generate tr3-format-->
	<xsl:template name="buildTree">
		<!-- named template parameter -->
		<xsl:param name="node" />
		<!-- get id of given node -->
		<xsl:variable name="node.id" select="$node/@id" />
		<!-- for each node or ref element build node and call self-->
		<xsl:for-each select="$tgf.layout//node[@parent=$node.id]">
			<xsl:variable name="node.id" select="@id" />
			<xsl:variable name="node.out" select="@out" />
			<xsl:variable name="node.type" select="if (count($tgf.layout//node[@parent=$node.id]) = 0) then 'leaf' else 'branch'" />
			<xsl:element name="{$node.type}">
				<xsl:attribute name="out" select="$node.out" />
				<xsl:attribute name="in" select="$tgf.structure//link[@end=$node.id]/@label" />
				<xsl:call-template name="buildTree">
					<xsl:with-param name="node" select="." />
				</xsl:call-template>
			</xsl:element>
		</xsl:for-each>

	</xsl:template>

</xsl:stylesheet>