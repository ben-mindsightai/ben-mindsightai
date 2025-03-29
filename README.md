// this api returns the entiry patent family
// each patent family looks like this:
//  <ops:patent-family legal="true" total-result-count="95">
// <ops:publication-reference>
//     <document-id document-id-type="epodoc">
//         <doc-number>US8163723</doc-number>
//     </document-id>
// </ops:publication-reference>
// <ops:family-member family-id="9938620">
//     <publication-reference>
//         <document-id document-id-type="docdb">
//             <country>US</country>
//             <doc-number>2010331289</doc-number>
//             <kind>A1</kind>
//             <date>20101230</date>
//         </document-id>
//         <document-id document-id-type="epodoc">
//             <doc-number>US2010331289</doc-number>
//             <date>20101230</date>
//         </document-id>
//     </publication-reference>
//     <application-reference doc-id="330117605">
//         <document-id document-id-type="docdb">
//             <country>US</country>
//             <doc-number>87951510</doc-number>
//             <kind>A</kind>
//             <date>20100910</date>
//         </document-id>
//     </application-reference>
//     <priority-claim sequence="1" kind="national">
//         <document-id document-id-type="docdb">
//             <country>GB</country>
//             <doc-number>0213739</doc-number>
//             <kind>A</kind>
//             <date>20020614</date>
//         </document-id>
//         <priority-active-indicator>YES</priority-active-indicator>
//     </priority-claim>
//     <priority-claim sequence="2" kind="national">
//         <document-id document-id-type="docdb">
//             <country>GB</country>
//             <doc-number>0302557</doc-number>
//             <kind>W</kind>
//             <date>20030613</date>
//         </document-id>
//         <priority-active-indicator>NO</priority-active-indicator>
//         <priority-linkage-type>W</priority-linkage-type>
//     </priority-claim>
//     <priority-claim sequence="3" kind="national">
//         <document-id document-id-type="docdb">
//             <country>US</country>
//             <doc-number>51801605</doc-number>
//             <kind>A</kind>
//             <date>20050706</date>
//         </document-id>
//         <priority-active-indicator>NO</priority-active-indicator>
//         <priority-linkage-type>3</priority-linkage-type>
//     </priority-claim>
//     <priority-claim sequence="4" kind="national">
//         <document-id document-id-type="docdb">
//             <country>US</country>
//             <doc-number>87951510</doc-number>
//             <kind>A</kind>
//             <date>20100910</date>
//         </document-id>
//         <priority-active-indicator>NO</priority-active-indicator>
//     </priority-claim>
//     <ops:legal code="AS  " desc="ASSIGNMENT" infl=" " dateMigr="00010101">
//         <ops:pre line="00001">US    87951510A  2014-04-04AS   ASSIGNMENT OWNER CIPLA LIMITED, INDIA</ops:pre>
//         <ops:pre line="00002">US    87951510A  2014-04-04AS   ASSIGNMENT Free Format Text ASSIGNMENT OF ASSIGNORS INTEREST;ASSIGNORS:LULLA, AMAR;MALHOTRA, GEENA;REEL/FRAME:032610/0399</ops:pre>
//         <ops:pre line="00003">US    87951510A  2014-04-04AS   ASSIGNMENT Effective DATE 20050523</ops:pre>
//         <ops:L001EP desc="Country Code">US</ops:L001EP>
//         <ops:L002EP desc="Filing / Published Document">F</ops:L002EP>
//         <ops:L003EP desc="Document Number">    87951510</ops:L003EP>
//         <ops:L004EP desc="Kind Code">A </ops:L004EP>
//         <ops:L005EP desc="IPR Type">PI</ops:L005EP>
//         <ops:L007EP desc="Gazette DATE">2014-04-04</ops:L007EP>
//         <ops:L008EP desc="Legal Event Code 1">AS</ops:L008EP>
//         <ops:L018EP desc="DATE last exchanged">2014-04-19</ops:L018EP>
//         <ops:L019EP desc="DATE first created">2014-04-17</ops:L019EP>
//         <ops:L500EP>
//             <ops:L509EP desc="OWNER">CIPLA LIMITED, INDIA</ops:L509EP>
//             <ops:L510EP desc="Free Format Text">ASSIGNMENT OF ASSIGNORS INTEREST;ASSIGNORS:LULLA, AMAR;MALHOTRA, GEENA;REEL/FRAME:032610/0399</ops:L510EP>
//             <ops:L525EP desc="Effective DATE">20050523</ops:L525EP>
//         </ops:L500EP>
//     </ops:legal>
//     <ops:legal code="CC  " desc="CERTIFICATE OF CORRECTION" infl=" " dateMigr="00010101">
//         <ops:pre line="00001">US    87951510A  2014-11-11CC   CERTIFICATE OF CORRECTION</ops:pre>
//         <ops:L001EP desc="Country Code">US</ops:L001EP>
//         <ops:L002EP desc="Filing / Published Document">F</ops:L002EP>
//         <ops:L003EP desc="Document Number">    87951510</ops:L003EP>
//         <ops:L004EP desc="Kind Code">A </ops:L004EP>
//         <ops:L005EP desc="IPR Type">PI</ops:L005EP>
//         <ops:L007EP desc="Gazette DATE">2014-11-11</ops:L007EP>
//         <ops:L008EP desc="Legal Event Code 1">CC</ops:L008EP>
//         <ops:L018EP desc="DATE last exchanged">2014-12-06</ops:L018EP>
//         <ops:L019EP desc="DATE first created">2014-12-03</ops:L019EP>
//         <ops:L500EP/>
//     </ops:legal>
//     <ops:legal code="FPAY" desc="FEE PAYMENT" infl="+" dateMigr="00010101">
//         <ops:pre line="00001">US    87951510A  2015-10-07FPAY+FEE PAYMENT Year of Fee Payment 4</ops:pre>
//         <ops:L001EP desc="Country Code">US</ops:L001EP>
//         <ops:L002EP desc="Filing / Published Document">F</ops:L002EP>
//         <ops:L003EP desc="Document Number">    87951510</ops:L003EP>
//         <ops:L004EP desc="Kind Code">A </ops:L004EP>
//         <ops:L005EP desc="IPR Type">PI</ops:L005EP>
//         <ops:L007EP desc="Gazette DATE">2015-10-07</ops:L007EP>
//         <ops:L008EP desc="Legal Event Code 1">FPAY</ops:L008EP>
//         <ops:L018EP desc="DATE last exchanged">2015-10-17</ops:L018EP>
//         <ops:L019EP desc="DATE first created">2015-10-14</ops:L019EP>
//         <ops:L500EP>
//             <ops:L520EP desc="Year of Fee Payment">4</ops:L520EP>
//         </ops:L500EP>
//     </ops:legal>
//     <ops:legal code="STCF" desc="INFORMATION ON STATUS: PATENT GRANT" infl=" " dateMigr="00010101">
//         <ops:pre line="00001">US    87951510A  2012-04-04STCF INFORMATION ON STATUS: PATENT GRANT Free Format Text PATENTED CASE</ops:pre>
//         <ops:L001EP desc="Country Code">US</ops:L001EP>
//         <ops:L002EP desc="Filing / Published Document">F</ops:L002EP>
//         <ops:L003EP desc="Document Number">    87951510</ops:L003EP>
//         <ops:L004EP desc="Kind Code">A </ops:L004EP>
//         <ops:L005EP desc="IPR Type">PI</ops:L005EP>
//         <ops:L007EP desc="Gazette DATE">2012-04-04</ops:L007EP>
//         <ops:L008EP desc="Legal Event Code 1">STCF</ops:L008EP>
//         <ops:L018EP desc="DATE last exchanged">2019-05-18</ops:L018EP>
//         <ops:L019EP desc="DATE first created">2019-05-14</ops:L019EP>
//         <ops:L500EP>
//             <ops:L510EP desc="Free Format Text">PATENTED CASE</ops:L510EP>
//         </ops:L500EP>
//     </ops:legal>
//     <ops:legal code="FEPP" desc="FEE PAYMENT PROCEDURE" infl=" " dateMigr="00010101">
//         <ops:pre line="00001">US    87951510A  2019-10-31FEPP FEE PAYMENT PROCEDURE Free Format Text 7.5 YR SURCHARGE - LATE PMT W/IN 6 MO, LARGE ENTITY (ORIGINAL EVENT CODE: M1555); ENTITY STATUS OF PATENT OWNER: LARGE ENTITY</ops:pre>
//         <ops:L001EP desc="Country Code">US</ops:L001EP>
//         <ops:L002EP desc="Filing / Published Document">F</ops:L002EP>
//         <ops:L003EP desc="Document Number">    87951510</ops:L003EP>
//         <ops:L004EP desc="Kind Code">A </ops:L004EP>
//         <ops:L005EP desc="IPR Type">PI</ops:L005EP>
//         <ops:L007EP desc="Gazette DATE">2019-10-31</ops:L007EP>
//         <ops:L008EP desc="Legal Event Code 1">FEPP</ops:L008EP>
//         <ops:L018EP desc="DATE last exchanged">2019-11-09</ops:L018EP>
//         <ops:L019EP desc="DATE first created">2019-11-07</ops:L019EP>
//         <ops:L500EP>
//             <ops:L510EP desc="Free Format Text">7.5 YR SURCHARGE - LATE PMT W/IN 6 MO, LARGE ENTITY (ORIGINAL EVENT CODE: M1555); ENTITY STATUS OF PATENT OWNER: LARGE ENTITY</ops:L510EP>
//         </ops:L500EP>
//     </ops:legal>
//     <ops:legal code="MAFP" desc="MAINTENANCE FEE PAYMENT" infl="+" dateMigr="00010101">
//         <ops:pre line="00001">US    87951510A  2019-10-31MAFP+MAINTENANCE FEE PAYMENT Free Format Text PAYMENT OF MAINTENANCE FEE, 8TH YEAR, LARGE ENTITY (ORIGINAL EVENT CODE: M1552); ENTITY STATUS OF PATENT OWNER: LARGE ENTITY</ops:pre>
//         <ops:pre line="00002">US    87951510A  2019-10-31MAFP+MAINTENANCE FEE PAYMENT Year of Fee Payment 8</ops:pre>
//         <ops:L001EP desc="Country Code">US</ops:L001EP>
//         <ops:L002EP desc="Filing / Published Document">F</ops:L002EP>
//         <ops:L003EP desc="Document Number">    87951510</ops:L003EP>
//         <ops:L004EP desc="Kind Code">A </ops:L004EP>
//         <ops:L005EP desc="IPR Type">PI</ops:L005EP>
//         <ops:L007EP desc="Gazette DATE">2019-10-31</ops:L007EP>
//         <ops:L008EP desc="Legal Event Code 1">MAFP</ops:L008EP>
//         <ops:L018EP desc="DATE last exchanged">2019-11-09</ops:L018EP>
//         <ops:L019EP desc="DATE first created">2019-11-07</ops:L019EP>
//         <ops:L500EP>
//             <ops:L510EP desc="Free Format Text">PAYMENT OF MAINTENANCE FEE, 8TH YEAR, LARGE ENTITY (ORIGINAL EVENT CODE: M1552); ENTITY STATUS OF PATENT OWNER: LARGE ENTITY</ops:L510EP>
//             <ops:L520EP desc="Year of Fee Payment">8</ops:L520EP>
//         </ops:L500EP>
//     </ops:legal>
//     <ops:legal code="IPR " desc="AIA TRIAL PROCEEDING FILED BEFORE THE PATENT AND APPEAL BOARD: INTER PARTES REVIEW" infl=" " dateMigr="00010101">
//         <ops:pre line="00001">US    87951510A  2020-03-03IPR  AIA TRIAL PROCEEDING FILED BEFORE THE PATENT AND APPEAL BOARD: INTER PARTES REVIEW Free Format Text TRIAL NO: IPR2020-00368</ops:pre>
//         <ops:pre line="00002">US    87951510A  2020-03-03IPR  AIA TRIAL PROCEEDING FILED BEFORE THE PATENT AND APPEAL BOARD: INTER PARTES REVIEW OPPONENT GLAXOSMITHKLINE CONSUMER HEALTHCARE HOLDINGS (US) LLC</ops:pre>
//         <ops:pre line="00003">US    87951510A  2020-03-03IPR  AIA TRIAL PROCEEDING FILED BEFORE THE PATENT AND APPEAL BOARD: INTER PARTES REVIEW Effective DATE 20200131</ops:pre>
//         <ops:L001EP desc="Country Code">US</ops:L001EP>
//         <ops:L002EP desc="Filing / Published Document">F</ops:L002EP>
//         <ops:L003EP desc="Document Number">    87951510</ops:L003EP>
//         <ops:L004EP desc="Kind Code">A </ops:L004EP>
//         <ops:L005EP desc="IPR Type">PI</ops:L005EP>
//         <ops:L007EP desc="Gazette DATE">2020-03-03</ops:L007EP>
//         <ops:L008EP desc="Legal Event Code 1">IPR</ops:L008EP>
//         <ops:L018EP desc="DATE last exchanged">2020-03-07</ops:L018EP>
//         <ops:L019EP desc="DATE first created">2020-03-04</ops:L019EP>
//         <ops:L500EP>
//             <ops:L510EP desc="Free Format Text">TRIAL NO: IPR2020-00368</ops:L510EP>
//             <ops:L519EP desc="OPPONENT">GLAXOSMITHKLINE CONSUMER HEALTHCARE HOLDINGS (US) LLC</ops:L519EP>
//             <ops:L525EP desc="Effective DATE">20200131</ops:L525EP>
//         </ops:L500EP>
//     </ops:legal>
//     <ops:legal code="FEPP" desc="FEE PAYMENT PROCEDURE" infl=" " dateMigr="00010101">
//         <ops:pre line="00001">US    87951510A  2023-12-11FEPP FEE PAYMENT PROCEDURE Free Format Text MAINTENANCE FEE REMINDER MAILED (ORIGINAL EVENT CODE: REM.); ENTITY STATUS OF PATENT OWNER: LARGE ENTITY</ops:pre>
//         <ops:L001EP desc="Country Code">US</ops:L001EP>
//         <ops:L002EP desc="Filing / Published Document">F</ops:L002EP>
//         <ops:L003EP desc="Document Number">    87951510</ops:L003EP>
//         <ops:L004EP desc="Kind Code">A </ops:L004EP>
//         <ops:L005EP desc="IPR Type">PI</ops:L005EP>
//         <ops:L007EP desc="Gazette DATE">2023-12-11</ops:L007EP>
//         <ops:L008EP desc="Legal Event Code 1">FEPP</ops:L008EP>
//         <ops:L018EP desc="DATE last exchanged">2023-12-16</ops:L018EP>
//         <ops:L019EP desc="DATE first created">2023-12-15</ops:L019EP>
//         <ops:L500EP>
//             <ops:L510EP desc="Free Format Text">MAINTENANCE FEE REMINDER MAILED (ORIGINAL EVENT CODE: REM.); ENTITY STATUS OF PATENT OWNER: LARGE ENTITY</ops:L510EP>
//         </ops:L500EP>
//     </ops:legal>
//     <ops:legal code="STCH" desc="INFORMATION ON STATUS: PATENT DISCONTINUATION" infl="-" dateMigr="00010101">
//         <ops:pre line="00001">US    87951510A  2024-05-28STCH-INFORMATION ON STATUS: PATENT DISCONTINUATION Free Format Text PATENT EXPIRED DUE TO NONPAYMENT OF MAINTENANCE FEES UNDER 37 CFR 1.362</ops:pre>
//         <ops:L001EP desc="Country Code">US</ops:L001EP>
//         <ops:L002EP desc="Filing / Published Document">F</ops:L002EP>
//         <ops:L003EP desc="Document Number">    87951510</ops:L003EP>
//         <ops:L004EP desc="Kind Code">A </ops:L004EP>
//         <ops:L005EP desc="IPR Type">PI</ops:L005EP>
//         <ops:L007EP desc="Gazette DATE">2024-05-28</ops:L007EP>
//         <ops:L008EP desc="Legal Event Code 1">STCH</ops:L008EP>
//         <ops:L018EP desc="DATE last exchanged">2024-06-08</ops:L018EP>
//         <ops:L019EP desc="DATE first created">2024-06-07</ops:L019EP>
//         <ops:L500EP>
//             <ops:L510EP desc="Free Format Text">PATENT EXPIRED DUE TO NONPAYMENT OF MAINTENANCE FEES UNDER 37 CFR 1.362</ops:L510EP>
//         </ops:L500EP>
//     </ops:legal>
//     <ops:legal code="LAPS" desc="LAPSE FOR FAILURE TO PAY MAINTENANCE FEES" infl="-" dateMigr="00010101">
//         <ops:pre line="00001">US    87951510A  2024-05-27LAPS-LAPSE FOR FAILURE TO PAY MAINTENANCE FEES Free Format Text PATENT EXPIRED FOR FAILURE TO PAY MAINTENANCE FEES (ORIGINAL EVENT CODE: EXP.); ENTITY STATUS OF PATENT OWNER: LARGE ENTITY</ops:pre>
//         <ops:L001EP desc="Country Code">US</ops:L001EP>
//         <ops:L002EP desc="Filing / Published Document">F</ops:L002EP>
//         <ops:L003EP desc="Document Number">    87951510</ops:L003EP>
//         <ops:L004EP desc="Kind Code">A </ops:L004EP>
//         <ops:L005EP desc="IPR Type">PI</ops:L005EP>
//         <ops:L007EP desc="Gazette DATE">2024-05-27</ops:L007EP>
//         <ops:L008EP desc="Legal Event Code 1">LAPS</ops:L008EP>
//         <ops:L018EP desc="DATE last exchanged">2024-06-08</ops:L018EP>
//         <ops:L019EP desc="DATE first created">2024-06-07</ops:L019EP>
//         <ops:L500EP>
//             <ops:L510EP desc="Free Format Text">PATENT EXPIRED FOR FAILURE TO PAY MAINTENANCE FEES (ORIGINAL EVENT CODE: EXP.); ENTITY STATUS OF PATENT OWNER: LARGE ENTITY</ops:L510EP>
//         </ops:L500EP>
//     </ops:legal>
//     <ops:legal code="FP  " desc="LAPSED DUE TO FAILURE TO PAY MAINTENANCE FEE" infl="-" dateMigr="00010101">
//         <ops:pre line="00001">US    87951510A  2024-06-18FP  -LAPSED DUE TO FAILURE TO PAY MAINTENANCE FEE Effective DATE 20240424</ops:pre>
//         <ops:L001EP desc="Country Code">US</ops:L001EP>
//         <ops:L002EP desc="Filing / Published Document">F</ops:L002EP>
//         <ops:L003EP desc="Document Number">    87951510</ops:L003EP>
//         <ops:L004EP desc="Kind Code">A </ops:L004EP>
//         <ops:L005EP desc="IPR Type">PI</ops:L005EP>
//         <ops:L007EP desc="Gazette DATE">2024-06-18</ops:L007EP>
//         <ops:L008EP desc="Legal Event Code 1">FP</ops:L008EP>
//         <ops:L018EP desc="DATE last exchanged">2024-06-22</ops:L018EP>
//         <ops:L019EP desc="DATE first created">2024-06-19</ops:L019EP>
//         <ops:L500EP>
//             <ops:L525EP desc="Effective DATE">20240424</ops:L525EP>
//         </ops:L500EP>
//     </ops:legal>
// </ops:family-member>
// we are focussed on <publication-reference> and we'll get the one that is document-id-type="epodoc" and we want to extract the date and doc-number
// we want to capture the document-id with document-id-type="epodoc", which is our main identifier and we will want to write this ans its related information into a table
// for each <ops:legal code> we extract the code itself stored in the "code" xml property
// and then we combine these 3 lines and store them as one column called "legal_event_description":
//                 <ops:pre line="00001">US    87951510A  2014-04-04AS   ASSIGNMENT OWNER CIPLA LIMITED, INDIA</ops:pre>
// <ops:pre line="00002">US    87951510A  2014-04-04AS   ASSIGNMENT Free Format Text ASSIGNMENT OF ASSIGNORS INTEREST;ASSIGNORS:LULLA, AMAR;MALHOTRA, GEENA;REEL/FRAME:032610/0399</ops:pre>
// <ops:pre line="00003">US    87951510A  2014-04-04AS   ASSIGNMENT Effective DATE 20050523</ops:pre>
//
// these need to be stored in their own columns (name them according to the "desc" property):
//                 <ops:L001EP desc="Country Code">US</ops:L001EP>
{/* <ops:L002EP desc="Filing / Published Document">F</ops:L002EP>
<ops:L003EP desc="Document Number">    87951510</ops:L003EP>
<ops:L004EP desc="Kind Code">A </ops:L004EP>
<ops:L005EP desc="IPR Type">PI</ops:L005EP>
<ops:L007EP desc="Gazette DATE">2014-04-04</ops:L007EP>
<ops:L008EP desc="Legal Event Code 1">AS</ops:L008EP>
<ops:L018EP desc="DATE last exchanged">2014-04-19</ops:L018EP>
<ops:L019EP desc="DATE first created">2014-04-17</ops:L019EP> */}
// and you do this for each legal code, and each family-member
// if the doc-number of the publication-reference is present, then we don't need to store it again