<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" encoding="UTF-8" />

	<xsl:param name="mark.copied"  select="1" />                <!-- mark copied nodes with class -->
	<xsl:param name="content.base" select="''" />				<!-- add base path to content path -->


	<!-- add levels and width, convert ref-links -->
	<xsl:template match="*">
		<xsl:param name="level" select="1"/>

		<xsl:variable name="content.ref"   select="@content"/>
		<xsl:variable name="element"       select="local-name(.)"/>
		<xsl:variable name="element.name"  select="if ($element != 'ref') then $element else 'leaf'"/>
		<xsl:variable name="element.class" select="@class"/>

		<!-- variable sub tree -->
		<xsl:variable name="subTree">
			<xsl:apply-templates select="*">
	    		<xsl:with-param name="level" select="$level+1"/>
	    	</xsl:apply-templates>
		</xsl:variable>

		<xsl:element name="{$element.name}">
			
	  		<xsl:attribute name="level" select="$level" />
	  		<xsl:attribute name="width" select="if ($element.name = 'leaf') then 1 else sum($subTree/*/@width)" />

	  		<!-- set node text for links -->
	  		<xsl:if test="$element = 'ref'">
	  			<xsl:attribute name="out" select="concat('[link] ',@link)" />
	  		</xsl:if>

	  		<xsl:variable name="classes">

	  			<!-- mark links -->
	  			<xsl:if test="$element = 'ref'"> link</xsl:if>
	  			<!-- mark copied nodes -->
	  			<xsl:if test="(@origin or ancestor::*[@origin]) and $mark.copied"> copy</xsl:if>

	  			<!-- add special node class with tr3-prefix-->
	  			<xsl:if test="$element.class != ''">
	  				<xsl:for-each select="tokenize($element.class, ' ')">
	  					<xsl:value-of select="concat(' tr3-', normalize-space(current()))" />
	  				</xsl:for-each>
		  		</xsl:if>

	  			<!-- add position of node with d-of-prefix (descendant of) -->
	  			<xsl:for-each select="ancestor::*">
	  				<xsl:value-of select="concat(' d-of-',@id)" />
	  			</xsl:for-each>

	  			<!-- add direct parent of node with c-of-prefix (child of) -->
	  			<xsl:for-each select="parent::*">
	  				<xsl:value-of select="concat(' c-of-',@id)" />
	  			</xsl:for-each>
	  		</xsl:variable>

	  		<!-- attributes -->
			<xsl:copy-of select="@*"/>

		  		<!-- assign classes -->	
		  		<xsl:if test="$classes != ''">	
		  			<xsl:attribute name="class" select="normalize-space($classes)" />
		  		</xsl:if>

		  		<!-- assign content -->
		  		<xsl:if test="$content.ref != ''">
		  			<xsl:attribute name="content" select="concat($content.base, normalize-space($content.ref))" />
		  		</xsl:if>

	  		<!-- children -->
	    	<xsl:copy-of select="$subTree"/>
	  		
		</xsl:element>
	</xsl:template>
</xsl:stylesheet>