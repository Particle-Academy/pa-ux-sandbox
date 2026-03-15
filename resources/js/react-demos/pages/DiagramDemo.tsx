import { Diagram } from "@particle-academy/react-fancy";
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
    </div>
  );
}
