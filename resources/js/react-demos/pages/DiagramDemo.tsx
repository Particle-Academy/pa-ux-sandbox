import { Diagram } from "@particle-academy/react-fancy";
import type { DiagramSchema } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

const erdSchema = {
  entities: [
    {
      name: "Users",
      fields: [
        { name: "id", type: "bigint", primary: true },
        { name: "name", type: "varchar(255)" },
        { name: "email", type: "varchar(255)" },
        { name: "created_at", type: "timestamp" },
      ],
    },
    {
      name: "Posts",
      fields: [
        { name: "id", type: "bigint", primary: true },
        { name: "user_id", type: "bigint", foreign: true },
        { name: "title", type: "varchar(255)" },
        { name: "body", type: "text" },
        { name: "published_at", type: "timestamp" },
      ],
    },
    {
      name: "Comments",
      fields: [
        { name: "id", type: "bigint", primary: true },
        { name: "post_id", type: "bigint", foreign: true },
        { name: "user_id", type: "bigint", foreign: true },
        { name: "body", type: "text" },
        { name: "created_at", type: "timestamp" },
      ],
    },
  ],
  relations: [
    { from: "Users", to: "Posts", type: "one-to-many" },
    { from: "Posts", to: "Comments", type: "one-to-many" },
    { from: "Users", to: "Comments", type: "one-to-many" },
  ],
};

const relationsSchema = {
  entities: [
    {
      name: "User",
      fields: [
        { name: "id", type: "bigint", primary: true },
        { name: "name", type: "varchar(255)" },
      ],
    },
    {
      name: "Profile",
      fields: [
        { name: "id", type: "bigint", primary: true },
        { name: "user_id", type: "bigint", foreign: true },
        { name: "bio", type: "text" },
      ],
    },
    {
      name: "Post",
      fields: [
        { name: "id", type: "bigint", primary: true },
        { name: "user_id", type: "bigint", foreign: true },
        { name: "title", type: "varchar(255)" },
      ],
    },
    {
      name: "Tag",
      fields: [
        { name: "id", type: "bigint", primary: true },
        { name: "name", type: "varchar(100)" },
      ],
    },
  ],
  relations: [
    { from: "User", to: "Profile", type: "one-to-one" },
    { from: "User", to: "Post", type: "one-to-many" },
    { from: "Post", to: "Tag", type: "many-to-many" },
  ],
};

export function DiagramDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Diagram</h1>

      <DemoSection title="ERD Diagram" description="Entity-Relationship Diagram with Users, Posts, and Comments. Supports export to ERD and UML formats." code={`const schema = {
  entities: [
    {
      name: "Users",
      fields: [
        { name: "id", type: "bigint", primary: true },
        { name: "name", type: "varchar(255)" },
        { name: "email", type: "varchar(255)" },
        { name: "created_at", type: "timestamp" },
      ],
    },
    {
      name: "Posts",
      fields: [
        { name: "id", type: "bigint", primary: true },
        { name: "user_id", type: "bigint", foreign: true },
        { name: "title", type: "varchar(255)" },
        { name: "body", type: "text" },
      ],
    },
    {
      name: "Comments",
      fields: [
        { name: "id", type: "bigint", primary: true },
        { name: "post_id", type: "bigint", foreign: true },
        { name: "user_id", type: "bigint", foreign: true },
        { name: "body", type: "text" },
      ],
    },
  ],
  relations: [
    { from: "Users", to: "Posts", type: "one-to-many" },
    { from: "Posts", to: "Comments", type: "one-to-many" },
    { from: "Users", to: "Comments", type: "one-to-many" },
  ],
};

<Diagram schema={schema} downloadable formats={["erd", "uml"]} />`}>
        <div style={{ height: 450 }}>
          <Diagram schema={erdSchema} downloadable formats={["erd", "uml"]} />
        </div>
      </DemoSection>

      <DemoSection title="Declarative API" description="Build the same diagram using composable child components instead of a schema prop." code={`<Diagram downloadable formats={["erd", "uml"]}>
  <Diagram.Entity name="Users">
    <Diagram.Field name="id" type="bigint" primary />
    <Diagram.Field name="name" type="varchar(255)" />
    <Diagram.Field name="email" type="varchar(255)" />
    <Diagram.Field name="created_at" type="timestamp" />
  </Diagram.Entity>
  <Diagram.Entity name="Posts">
    <Diagram.Field name="id" type="bigint" primary />
    <Diagram.Field name="user_id" type="bigint" foreign />
    <Diagram.Field name="title" type="varchar(255)" />
    <Diagram.Field name="body" type="text" />
  </Diagram.Entity>
  <Diagram.Entity name="Comments">
    <Diagram.Field name="id" type="bigint" primary />
    <Diagram.Field name="post_id" type="bigint" foreign />
    <Diagram.Field name="user_id" type="bigint" foreign />
    <Diagram.Field name="body" type="text" />
  </Diagram.Entity>
  <Diagram.Relation from="Users" to="Posts" type="one-to-many" />
  <Diagram.Relation from="Posts" to="Comments" type="one-to-many" />
  <Diagram.Relation from="Users" to="Comments" type="one-to-many" />
</Diagram>`}>
        <div style={{ height: 450 }}>
          <Diagram downloadable formats={["erd", "uml"]}>
            <Diagram.Entity name="Users">
              <Diagram.Field name="id" type="bigint" primary />
              <Diagram.Field name="name" type="varchar(255)" />
              <Diagram.Field name="email" type="varchar(255)" />
              <Diagram.Field name="created_at" type="timestamp" />
            </Diagram.Entity>
            <Diagram.Entity name="Posts">
              <Diagram.Field name="id" type="bigint" primary />
              <Diagram.Field name="user_id" type="bigint" foreign />
              <Diagram.Field name="title" type="varchar(255)" />
              <Diagram.Field name="body" type="text" />
            </Diagram.Entity>
            <Diagram.Entity name="Comments">
              <Diagram.Field name="id" type="bigint" primary />
              <Diagram.Field name="post_id" type="bigint" foreign />
              <Diagram.Field name="user_id" type="bigint" foreign />
              <Diagram.Field name="body" type="text" />
            </Diagram.Entity>
            <Diagram.Relation from="Users" to="Posts" type="one-to-many" />
            <Diagram.Relation from="Posts" to="Comments" type="one-to-many" />
            <Diagram.Relation from="Users" to="Comments" type="one-to-many" />
          </Diagram>
        </div>
      </DemoSection>

      <DemoSection title="Relations" description="All three relation types: one-to-one, one-to-many, and many-to-many." code={`const schema = {
  entities: [
    { name: "User", fields: [{ name: "id", type: "bigint", primary: true }, ...] },
    { name: "Profile", fields: [{ name: "id", type: "bigint", primary: true }, ...] },
    { name: "Post", fields: [{ name: "id", type: "bigint", primary: true }, ...] },
    { name: "Tag", fields: [{ name: "id", type: "bigint", primary: true }, ...] },
  ],
  relations: [
    { from: "User", to: "Profile", type: "one-to-one" },
    { from: "User", to: "Post", type: "one-to-many" },
    { from: "Post", to: "Tag", type: "many-to-many" },
  ],
};

<Diagram schema={schema} />`}>
        <div style={{ height: 400 }}>
          <Diagram schema={relationsSchema} />
        </div>
      </DemoSection>

      <DemoSection
        title="Connector markers"
        description="Mix and match endpoint markers per relation. Use one of the typed shorthands (one-to-many, association, aggregation, composition, inheritance, implementation, dependency) or set fromMarker / toMarker explicitly. Emoji markers via the `emoji:` prefix."
        code={`<Diagram>
  <Diagram.Entity name="A" />
  <Diagram.Entity name="B" />
  <Diagram.Relation from="A" to="B" type="aggregation" />     {/* diamond-open → none */}
  <Diagram.Relation from="A" to="B" type="composition" />     {/* diamond → none */}
  <Diagram.Relation from="A" to="B" type="inheritance" />     {/* none → triangle-open */}
  <Diagram.Relation from="A" to="B" type="dependency" />      {/* none → arrow, dashed */}
  <Diagram.Relation from="A" to="B" fromMarker="circle" toMarker="square" />
  <Diagram.Relation from="A" to="B" fromMarker="emoji:🚀" toMarker="emoji:🎯" />
</Diagram>`}
      >
        <div style={{ height: 460 }}>
          <Diagram schema={markerShowcaseSchema} />
        </div>
      </DemoSection>

      <DemoSection
        title="Routing modes"
        description="Manhattan (default — right-angle elbows that dodge other entities), Bezier (smooth curves), or Straight (direct line). Manhattan is the cleanest look for ERD/UML; Bezier feels more sketchy/organic."
        code={`<Diagram.Relation from="A" to="C" routing="manhattan" />
<Diagram.Relation from="A" to="C" routing="bezier" />
<Diagram.Relation from="A" to="C" routing="straight" />`}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {(["manhattan", "bezier", "straight"] as const).map((routing) => (
            <div key={routing}>
              <div className="mb-1 font-mono text-xs text-zinc-500">routing="{routing}"</div>
              <div style={{ height: 280 }}>
                <Diagram schema={routingDemoSchema(routing)} />
              </div>
            </div>
          ))}
        </div>
      </DemoSection>

      <DemoSection
        title="Obstacle avoidance"
        description="Manhattan routing dodges around entities that would otherwise cross the line. Drag a node to see the relation re-route on the fly."
        code={`<Diagram schema={...}> {/* relations route AROUND any node not on the from/to */}`}
      >
        <div style={{ height: 460 }}>
          <Diagram schema={obstacleSchema} />
        </div>
      </DemoSection>
    </div>
  );
}

const markerShowcaseSchema: DiagramSchema = {
  entities: [
    { name: "A", x: 80, y: 60, fields: [{ name: "id", type: "bigint", primary: true }] },
    { name: "B", x: 480, y: 60, fields: [{ name: "id", type: "bigint", primary: true }, { name: "a_id", type: "bigint", foreign: true }] },
  ],
  relations: [
    { from: "A", to: "B", type: "aggregation", label: "aggregation" },
    { from: "A", to: "B", type: "composition", label: "composition" },
    { from: "A", to: "B", type: "inheritance", label: "inheritance" },
    { from: "A", to: "B", type: "dependency", label: "dependency" },
    { from: "A", to: "B", fromMarker: "circle", toMarker: "square", label: "circle ↔ square" },
    { from: "A", to: "B", fromMarker: "emoji:🚀", toMarker: "emoji:🎯", label: "emoji" },
  ],
};

function routingDemoSchema(routing: "manhattan" | "bezier" | "straight"): DiagramSchema {
  return {
    entities: [
      { name: "A", x: 40, y: 40, fields: [{ name: "id", type: "bigint", primary: true }] },
      { name: "B", x: 220, y: 140, fields: [{ name: "id", type: "bigint", primary: true }, { name: "a_id", type: "bigint", foreign: true }] },
    ],
    relations: [
      { from: "A", to: "B", type: "one-to-many", routing },
    ],
  };
}

const obstacleSchema: DiagramSchema = {
  entities: [
    { name: "Source", x: 60, y: 80, fields: [{ name: "id", type: "bigint", primary: true }] },
    // Big obstacle right between Source and Target
    { name: "Obstacle", x: 360, y: 60, fields: [
      { name: "id", type: "bigint", primary: true },
      { name: "kind", type: "varchar(100)" },
      { name: "value", type: "text" },
      { name: "tags", type: "json" },
    ] },
    { name: "Target", x: 720, y: 80, fields: [
      { name: "id", type: "bigint", primary: true },
      { name: "source_id", type: "bigint", foreign: true },
    ] },
  ],
  relations: [
    { from: "Source", to: "Target", type: "one-to-many", label: "routes around Obstacle" },
  ],
};
