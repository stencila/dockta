##  Dockerfile labels to JSON-LD schema crosswalk

The table below is a (metadata) [schema crosswalk](https://en.wikipedia.org/wiki/Schema_crosswalk) from Dockerfile labels
to  JSON-LD schema either schema.org or codemeta.

| Docker Labels  | Property (context:type.property)           |
|:---------------|:-------------------------------------------|
| created        | schema:SoftwareSourceCode.dateCreated      |
| url            | schema:Thing.url                           |
| source         | schema:SoftwareSourceCode.codeRepository   |
| version        | schema:SoftwareApplication.softwareVersion |
| revision       |                                            |
| vendor         | schema:Organization.legalName              |
| title          | schema:Thing.name                          |
| description    | schema:Thing.description                   |
| documentation  | schema:softwareHelp                        |
| authors        | schema:CreativeWork.author                 |
| licenses       | schema:CreativeWork.license                |
| maintainer     | codemeta:SoftwareSourceCode.maintainer     |
| build          |                                            |
| schema-version |                                            |
| ref-name       |                                            |