<xsl:stylesheet version="2.0" 
  xmlns:svg="http://www.w3.org/2000/svg" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:html="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="svg html">
  <xsl:output encoding="UTF-8" method="html"/>

  <xsl:variable name="scale" select="30"/>
  <xsl:variable name="maxLevel" select="max(//*/@level) + (60 div sum(*/@width))" />

  <!-- build application frame -->
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <!-- load head part -->
      <xsl:copy-of select="document('../../tr3x/app/head.xml')" />
      <!-- generate html-body for application -->
      <body data-title="{tr3/@title}">
        <!-- load sidebar panel -->
        <xsl:copy-of select="document('../../tr3x/app/panel.xml')" />
        <!-- start building svg, read layout information -->
        <div class="app-tree" data-scale="{$scale}" data-maxlevel="{$maxLevel}" data-maxwidth="{sum(*/@width)}">
          <!-- svg element -->
          <svg width="{sum(*/@width) * $scale * 2}mm" height="{$maxLevel * $scale}mm" onload="tr3x.init()" xmlns="http://www.w3.org/2000/svg">
            <!-- main group scaled and transformed (moved to position) -->
            <g id="main" transform="translate({$scale * 2},{$scale div 2}) scale({$scale})">
              <!-- go! -->
              <xsl:apply-templates select="*"/>
            </g >
          </svg>
        </div>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="*">

    <!-- get node information -->
    <xsl:variable name="elementID"      select="@id" />
    <xsl:variable name="elementName"    select="local-name(.)" />
    <xsl:variable name="elementContent" select="if (@content!='') then @content else ''" />
    <!-- calculate node position -->
      <!-- x-position: look for preceding elements on same level or childless elements 
      on lesser level take their width (+ some fine tuning) and sum it -->

    <xsl:variable name="x" select="
        (sum(
          preceding::*[
            @level = current()/@level
              or 
            (
              count(*) = 0 
                and 
              @level &lt;= current()/@level
            )
          ]
          /@width)
          + (@width div 2)
        ) 
        * 5 
        "/>
      <!-- y-position: multiply node level by 3 -->
    <xsl:variable name="y" select="@level * 4"/>
    
    <!-- generate node -->
    <g id="{$elementID}" class="{concat($elementID, ' svg-node ', @class)}" xmlns="http://www.w3.org/2000/svg" title="{@out}">
      <!-- description field used for content-URL -->
      <desc>
        <xsl:value-of select="$elementContent" />
      </desc>
      <!-- build rectangle -->
      <rect class="{concat($elementName, ' svg-node ', @class)}" height="1" rx="0.2" ry="0.2"  width="4.4" x="{$x - 2.2}" y="{$y - 1}" title="{@out}"/>
      <!-- build node text -->
      <text x="{$x}" y="{$y - 0.3}">
        <!-- mark errors with class -->
        <xsl:if test="contains(@class, 'tr3-error')">
          <xsl:attribute name="class">tr3-error</xsl:attribute>
        </xsl:if>
        <!-- shorten string to 22 chars to fit in rectangle (svg doesnt support word wrapping) -->
        <xsl:value-of select="if (string-length(@out) &gt; 23) then concat(substring(@out,0,23),'...?') else @out"/>
      </text>
    </g> 
    
    <!-- generate connections -->
    <g class="{child::*/@class}" xmlns="http://www.w3.org/2000/svg">
      <xsl:for-each select="*">
        <!-- connect child nodes -->
        <line class="connection" x1="{$x}" x2="{(sum(preceding::*[@level=current()/@level or (not(*) and @level &lt;=current()/@level)]/@width) + (@width div 2)) * 5}" y1="{$y}" y2="{@level * 4 - 1}"/>
        <!-- label node connections and add c-to-class-->
        <text x="{($x + ((sum(preceding::*[@level=current()/@level or (not(*) and @level &lt;=current()/@level)]/@width) + (@width div 2)) * 5)) div 2}" y="{($y + (@level * 4 - 1)) div 2 - 0.3}" class="{concat('c-to-', ../@id, ' svg-connection')}">
          <xsl:value-of select="@in"/>
        </text>
      </xsl:for-each>
    </g>

    <!-- generate links -->
    <!-- <xsl:if test="contains(@class,'link') and not(contains(@class,'copy'))"> // do not show copied links-->
    <xsl:if test="contains(@class,'link')">
      <!-- connect linked nodes -->
      <xsl:variable name="target" select="@link" />
      <!-- loop over link targets (should only be one, except for copied nodes) -->
      <xsl:for-each select="//*[@id = $target]">
        <g class="linkline">
          <line class="{child::*/@class}" x1="{$x}" x2="{(sum(preceding::*[@level=current()/@level or (not(*) and @level &lt;=current()/@level)]/@width) + (@width div 2)) * 5}" y1="{$y - 1}" y2="{@level * 4}" />
        </g>
      </xsl:for-each>
    </xsl:if>

    <!-- next set -->
    <xsl:apply-templates select="*"/>
  </xsl:template>

</xsl:stylesheet>