import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token: Scalars['String']['output'];
  user: User;
};

export type Camera = {
  __typename?: 'Camera';
  address: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** Product photo path, served by the frontend. */
  imageUrl?: Maybe<Scalars['String']['output']>;
  /** Axis model designation, e.g. P3265-LVE. */
  name: Scalars['String']['output'];
  /** Operator-chosen label. Null when never set. */
  niceName?: Maybe<Scalars['String']['output']>;
  /** Every operator this camera is assigned to. A camera may be shared. */
  users: Array<User>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Registers a new camera on the network. Provided with the starter; unchanged. */
  addCamera: Camera;
  /** Grants an operator access to a camera. Idempotent. */
  assignCameraToUser: User;
  /** Exchanges a username for a bearer token. No password by design — see docs/SPEC-BRIEF.md. */
  login: AuthPayload;
  /** Revokes an operator's access to a camera. Idempotent, and never deletes the camera. */
  unassignCameraFromUser: User;
};


export type MutationAddCameraArgs = {
  address: Scalars['String']['input'];
  name: Scalars['String']['input'];
  niceName?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAssignCameraToUserArgs = {
  cameraId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  username: Scalars['String']['input'];
};


export type MutationUnassignCameraFromUserArgs = {
  cameraId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  /** Every camera on the network, whether or not it is assigned to anyone. */
  cameras: Array<Camera>;
  /** The signed-in operator, or null when the request carries no valid token. */
  me?: Maybe<User>;
  /** All operators. Populates the sign-in screen. */
  users: Array<User>;
};

export type User = {
  __typename?: 'User';
  /** Cameras assigned to this operator. */
  cameras: Array<Camera>;
  displayName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  username: Scalars['String']['output'];
};

export type CameraFieldsFragment = { __typename?: 'Camera', id: string, name: string, niceName?: string | null, address: string, imageUrl?: string | null };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, username: string, displayName: string, cameras: Array<{ __typename?: 'Camera', id: string, name: string, niceName?: string | null, address: string, imageUrl?: string | null }> } | null };

export type UsersQueryVariables = Exact<{ [key: string]: never; }>;


export type UsersQuery = { __typename?: 'Query', users: Array<{ __typename?: 'User', id: string, username: string, displayName: string }> };

export type FleetQueryVariables = Exact<{ [key: string]: never; }>;


export type FleetQuery = { __typename?: 'Query', cameras: Array<{ __typename?: 'Camera', id: string, name: string, niceName?: string | null, address: string, imageUrl?: string | null, users: Array<{ __typename?: 'User', id: string, displayName: string }> }> };

export type LoginMutationVariables = Exact<{
  username: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', token: string, user: { __typename?: 'User', id: string, username: string, displayName: string } } };

export type AssignCameraMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  cameraId: Scalars['ID']['input'];
}>;


export type AssignCameraMutation = { __typename?: 'Mutation', assignCameraToUser: { __typename?: 'User', id: string, cameras: Array<{ __typename?: 'Camera', id: string, name: string, niceName?: string | null, address: string, imageUrl?: string | null }> } };

export type UnassignCameraMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  cameraId: Scalars['ID']['input'];
}>;


export type UnassignCameraMutation = { __typename?: 'Mutation', unassignCameraFromUser: { __typename?: 'User', id: string, cameras: Array<{ __typename?: 'Camera', id: string, name: string, niceName?: string | null, address: string, imageUrl?: string | null }> } };

export const CameraFieldsFragmentDoc = gql`
    fragment CameraFields on Camera {
  id
  name
  niceName
  address
  imageUrl
}
    `;
export const MeDocument = gql`
    query Me {
  me {
    id
    username
    displayName
    cameras {
      ...CameraFields
    }
  }
}
    ${CameraFieldsFragmentDoc}`;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: Apollo.QueryHookOptions<MeQuery, MeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
      }
export function useMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
// @ts-ignore
export function useMeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>): Apollo.UseSuspenseQueryResult<MeQuery, MeQueryVariables>;
export function useMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>): Apollo.UseSuspenseQueryResult<MeQuery | undefined, MeQueryVariables>;
export function useMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeSuspenseQueryHookResult = ReturnType<typeof useMeSuspenseQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const UsersDocument = gql`
    query Users {
  users {
    id
    username
    displayName
  }
}
    `;

/**
 * __useUsersQuery__
 *
 * To run a query within a React component, call `useUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUsersQuery({
 *   variables: {
 *   },
 * });
 */
export function useUsersQuery(baseOptions?: Apollo.QueryHookOptions<UsersQuery, UsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UsersQuery, UsersQueryVariables>(UsersDocument, options);
      }
export function useUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UsersQuery, UsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UsersQuery, UsersQueryVariables>(UsersDocument, options);
        }
// @ts-ignore
export function useUsersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<UsersQuery, UsersQueryVariables>): Apollo.UseSuspenseQueryResult<UsersQuery, UsersQueryVariables>;
export function useUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UsersQuery, UsersQueryVariables>): Apollo.UseSuspenseQueryResult<UsersQuery | undefined, UsersQueryVariables>;
export function useUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UsersQuery, UsersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UsersQuery, UsersQueryVariables>(UsersDocument, options);
        }
export type UsersQueryHookResult = ReturnType<typeof useUsersQuery>;
export type UsersLazyQueryHookResult = ReturnType<typeof useUsersLazyQuery>;
export type UsersSuspenseQueryHookResult = ReturnType<typeof useUsersSuspenseQuery>;
export type UsersQueryResult = Apollo.QueryResult<UsersQuery, UsersQueryVariables>;
export const FleetDocument = gql`
    query Fleet {
  cameras {
    ...CameraFields
    users {
      id
      displayName
    }
  }
}
    ${CameraFieldsFragmentDoc}`;

/**
 * __useFleetQuery__
 *
 * To run a query within a React component, call `useFleetQuery` and pass it any options that fit your needs.
 * When your component renders, `useFleetQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFleetQuery({
 *   variables: {
 *   },
 * });
 */
export function useFleetQuery(baseOptions?: Apollo.QueryHookOptions<FleetQuery, FleetQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FleetQuery, FleetQueryVariables>(FleetDocument, options);
      }
export function useFleetLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FleetQuery, FleetQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FleetQuery, FleetQueryVariables>(FleetDocument, options);
        }
// @ts-ignore
export function useFleetSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FleetQuery, FleetQueryVariables>): Apollo.UseSuspenseQueryResult<FleetQuery, FleetQueryVariables>;
export function useFleetSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FleetQuery, FleetQueryVariables>): Apollo.UseSuspenseQueryResult<FleetQuery | undefined, FleetQueryVariables>;
export function useFleetSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FleetQuery, FleetQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FleetQuery, FleetQueryVariables>(FleetDocument, options);
        }
export type FleetQueryHookResult = ReturnType<typeof useFleetQuery>;
export type FleetLazyQueryHookResult = ReturnType<typeof useFleetLazyQuery>;
export type FleetSuspenseQueryHookResult = ReturnType<typeof useFleetSuspenseQuery>;
export type FleetQueryResult = Apollo.QueryResult<FleetQuery, FleetQueryVariables>;
export const LoginDocument = gql`
    mutation Login($username: String!) {
  login(username: $username) {
    token
    user {
      id
      username
      displayName
    }
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      username: // value for 'username'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const AssignCameraDocument = gql`
    mutation AssignCamera($userId: ID!, $cameraId: ID!) {
  assignCameraToUser(userId: $userId, cameraId: $cameraId) {
    id
    cameras {
      ...CameraFields
    }
  }
}
    ${CameraFieldsFragmentDoc}`;
export type AssignCameraMutationFn = Apollo.MutationFunction<AssignCameraMutation, AssignCameraMutationVariables>;

/**
 * __useAssignCameraMutation__
 *
 * To run a mutation, you first call `useAssignCameraMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAssignCameraMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [assignCameraMutation, { data, loading, error }] = useAssignCameraMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      cameraId: // value for 'cameraId'
 *   },
 * });
 */
export function useAssignCameraMutation(baseOptions?: Apollo.MutationHookOptions<AssignCameraMutation, AssignCameraMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AssignCameraMutation, AssignCameraMutationVariables>(AssignCameraDocument, options);
      }
export type AssignCameraMutationHookResult = ReturnType<typeof useAssignCameraMutation>;
export type AssignCameraMutationResult = Apollo.MutationResult<AssignCameraMutation>;
export type AssignCameraMutationOptions = Apollo.BaseMutationOptions<AssignCameraMutation, AssignCameraMutationVariables>;
export const UnassignCameraDocument = gql`
    mutation UnassignCamera($userId: ID!, $cameraId: ID!) {
  unassignCameraFromUser(userId: $userId, cameraId: $cameraId) {
    id
    cameras {
      ...CameraFields
    }
  }
}
    ${CameraFieldsFragmentDoc}`;
export type UnassignCameraMutationFn = Apollo.MutationFunction<UnassignCameraMutation, UnassignCameraMutationVariables>;

/**
 * __useUnassignCameraMutation__
 *
 * To run a mutation, you first call `useUnassignCameraMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnassignCameraMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unassignCameraMutation, { data, loading, error }] = useUnassignCameraMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      cameraId: // value for 'cameraId'
 *   },
 * });
 */
export function useUnassignCameraMutation(baseOptions?: Apollo.MutationHookOptions<UnassignCameraMutation, UnassignCameraMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UnassignCameraMutation, UnassignCameraMutationVariables>(UnassignCameraDocument, options);
      }
export type UnassignCameraMutationHookResult = ReturnType<typeof useUnassignCameraMutation>;
export type UnassignCameraMutationResult = Apollo.MutationResult<UnassignCameraMutation>;
export type UnassignCameraMutationOptions = Apollo.BaseMutationOptions<UnassignCameraMutation, UnassignCameraMutationVariables>;