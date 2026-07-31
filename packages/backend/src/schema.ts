import { createSchema} from 'graphql-yoga'

const typeDefinition = /* GraphQL */ `
    type Query {
        cameras: [Camera!]!
    }

    type Mutation {
        addCamera(name: String!, niceName: String, address: String!): Camera!
    }

    type Camera {
        id: ID!
        name: String!
        niceName: String
        address: String!
    }
`

type Camera = {
    id: string
    name: string
    niceName?: string
    address: string
}

const cameras: Camera[] = [
    {
        id: '0',
        name: 'A8207-VE MKII',
        address: '192.168.1.101',
    },
    {
        id: '1',
        name: 'I8307-VE',
        niceName: "My Device",
        address: '192.168.1.102',
    }
]

const resolvers = {
    Query: {
        cameras: () => cameras
    },
    Mutation: {
        addCamera: (parent: unknown, args: Omit<Camera, 'id'>) => {
            const id = cameras.length

            const camera: Camera = {
                id: `${id}`,
                ...args
            }

            cameras.push(camera)

            return camera
        }
    },
    Camera: {
        id: (parent: Camera) => parent.id,
        name: (parent: Camera) => parent.name,
        niceName: (parent: Camera) => parent.niceName,
        address: (parent: Camera) => parent.address
    }
}

export const schema = createSchema({
    resolvers: [resolvers],
    typeDefs: [typeDefinition]
})