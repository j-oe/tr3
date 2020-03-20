<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:tr3="http://www.hs-karlsruhe.de/kmm-m/tr3">

	<xsl:output method="xml" encoding="UTF-8" />

	<xsl:param name="enable.reuse"    select="1" /> <!-- if 0 instead of copying, references will be generated -->
	<xsl:param name="generate.ids"    select="1" /> <!-- if 0 no additional ids will be generated -->
	<xsl:param name="avoid.recursion" select="1" /> <!-- if 0 a recursion copy will generate an error node -->

	<xsl:template match="@*|node()">
		<!-- check every element for empty attributes -->
		<xsl:value-of select="tr3:empty(.)" />
		<!-- copy node and generate id if needed -->
	    <xsl:copy>
	    	<xsl:if test="$generate.ids = 1">
	    		<xsl:attribute name="id" select="if (@id) then @id else generate-id(.)" />
	    	</xsl:if>
	        <xsl:apply-templates select="@* | node()"/>
	    </xsl:copy>
	</xsl:template>

	<!-- reference copy -->
	<xsl:template match="tr3:ref[@copy]">
		<!-- check every attribute if empty -->
		<xsl:value-of select="tr3:empty(.)" />

		<xsl:variable name="ref.id"    select="@copy" />
		<xsl:variable name="ref.in"    select="@in" />

		<xsl:if test="$enable.reuse = 0">
			<xsl:choose>
				<xsl:when test="count(//*[@id = $ref.id]) = 1">
					<xsl:copy>
			    		<xsl:attribute name="link" select="@copy" />
				        <xsl:apply-templates select="@*[not(contains(name(),'copy'))]|node()"/>
			    	</xsl:copy>
			    </xsl:when>
			    <xsl:otherwise>
			    	<xsl:call-template name="error">
		        		<xsl:with-param name="message">no id '<xsl:value-of select="$ref.id" />'</xsl:with-param>
		        		<xsl:with-param name="in" select="$ref.in" />
		        		<xsl:with-param name="id" select="generate-id(.)" />
		        	</xsl:call-template>
			    </xsl:otherwise>
			</xsl:choose>
		</xsl:if>

		<xsl:if test="$enable.reuse = 1">
			<xsl:choose>
				<xsl:when test="count(//*[@id = $ref.id]) = 1">
					<xsl:variable name="ref.elem"  select="local-name(//*[@id=$ref.id])"/>
					<xsl:variable name="recursion" select="count(ancestor::*[@id=$ref.id])" />

				  	<xsl:if test="$recursion = 0">
					  	<!-- copy element or branch -->
					  	<xsl:element name="{$ref.elem}" namespace="http://www.hs-karlsruhe.de/kmm-m/tr3">
					  		<xsl:if test="$generate.ids = 1">
					  			<xsl:attribute name="id" select="generate-id(.)" />
					  		</xsl:if>
					  		<xsl:attribute name="in" select="$ref.in" />
					  		<xsl:attribute name="origin" select="$ref.id" />
					  		<xsl:apply-templates select="//*[@id=$ref.id]/@*[not(contains(name(),'id'))][not(contains(name(),'in'))] | //*[@id=$ref.id]/node()"/>
					     </xsl:element>
					 </xsl:if>
			        <!-- throw error if recursive copying is detected -->
			        <xsl:if test="$recursion &gt; 0">

			        	<xsl:if test="$avoid.recursion = 1">
				        	<!-- copy and change wrong copy attribute to link attribute to avoid recursive tree building -->
				        	<xsl:copy>
				        		<xsl:message>tr3 notice: changed copy attribute to link attribute</xsl:message>
				        		<xsl:attribute name="link" select="@copy" />
						        <xsl:apply-templates select="@*[not(contains(name(),'copy'))]|node()"/>
						    </xsl:copy>
						</xsl:if>
						<xsl:if test="$avoid.recursion = 0">
				        	<xsl:call-template name="error">
				        		<xsl:with-param name="message">infinite loop</xsl:with-param>
				        		<xsl:with-param name="in">path error</xsl:with-param>
				        		<xsl:with-param name="id" select="generate-id(.)" />
				        	</xsl:call-template>
				        </xsl:if>
			        </xsl:if>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="error">
		        		<xsl:with-param name="message">no id '<xsl:value-of select="$ref.id" />'</xsl:with-param>
		        		<xsl:with-param name="in" select="$ref.in" />
		        		<xsl:with-param name="id" select="generate-id(.)" />
		        	</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:if>
	</xsl:template>

	<xsl:template match="tr3:ref">
		<xsl:variable name="ref.link" select="@link" />
		<!-- throw error if link attribute misses -->
        <xsl:if test="not(@link)">
        	<xsl:call-template name="error">
        		<xsl:with-param name="message">no link attr</xsl:with-param>
        		<xsl:with-param name="in" select="@in" />
        		<xsl:with-param name="id" select="generate-id(.)" />
        	</xsl:call-template>
        </xsl:if>
        <xsl:if test="@link">
        	<xsl:value-of select="tr3:empty(.)" />
        	<!-- throw error if dead link detected (no match for id) -->
        	<xsl:if test="count(//*[@id = $ref.link]) = 0">
	        	<xsl:call-template name="error">
	        		<xsl:with-param name="message">no id '<xsl:value-of select="$ref.link" />'</xsl:with-param>
	        		<xsl:with-param name="in" select="@in" />
	        		<xsl:with-param name="id" select="generate-id(.)" />
	        	</xsl:call-template>
	        </xsl:if>
	        <xsl:if test="count(//*[@id = $ref.link]) > 0">
			    <xsl:copy>
			        <xsl:apply-templates select="@*|node()"/>
			    </xsl:copy>
			</xsl:if>
		</xsl:if>
	</xsl:template>

	<!-- function to check if a node has any empty attributes -->
	<xsl:function name="tr3:empty">
		<xsl:param name="node" />
		<xsl:for-each select="$node/@*">
			<xsl:if test="current() = ''">
				<xsl:call-template name="error">
	        		<xsl:with-param name="message">@<xsl:value-of select="name()" /> empty on <xsl:value-of select="$node/local-name()" /></xsl:with-param>
	        		<xsl:with-param name="id" select="generate-id($node)" />
	        	</xsl:call-template>
			</xsl:if>
		</xsl:for-each>
	</xsl:function>

	<!-- error handling -->
	<xsl:template name="error">
	    <xsl:param name="message" />
	    <xsl:param name="id" />
	    <xsl:param name="in" />
	    <xsl:element name="leaf" namespace="http://www.hs-karlsruhe.de/kmm-m/tr3">
	  		<xsl:attribute name="class">error</xsl:attribute>
	  		<xsl:attribute name="in" select="$in" />
	  		<xsl:if test="$generate.ids = 1">
	  			<xsl:attribute name="id" select="$id" />
	  		</xsl:if>
	  		<xsl:attribute name="out" select="concat('[error] ',$message)" />
	    </xsl:element>
	    <xsl:message>tr3 error: <xsl:value-of select="$message" /></xsl:message>
	</xsl:template>

</xsl:stylesheet>