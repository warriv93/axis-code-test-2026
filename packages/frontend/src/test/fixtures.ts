import type { MockedResponse } from "@apollo/client/testing";
import {
  FleetDocument,
  MeDocument,
  UsersDocument,
  type CameraFieldsFragment,
} from "../api/generated";

export const camera = (
  id: string,
  name: string,
  niceName: string | null,
  address: string,
): CameraFieldsFragment => ({
  __typename: "Camera",
  id,
  name,
  niceName,
  address,
  imageUrl: `/camera-images/${name.toLowerCase()}.webp`,
});

export const CAM_A = camera("0", "A8207-VE MKII", null, "192.168.1.101");
export const CAM_B = camera("1", "I8307-VE", "My Device", "192.168.1.102");
export const CAM_C = camera("4", "Q6135-LE", "Perimeter PTZ", "192.168.1.105");

export const ALICE = {
  __typename: "User" as const,
  id: "alice",
  username: "alice",
  displayName: "Alice Lindqvist",
};

export const meMock = (cameras: CameraFieldsFragment[]): MockedResponse => ({
  request: { query: MeDocument },
  result: { data: { me: { ...ALICE, cameras } } },
});

export const meSignedOutMock = (): MockedResponse => ({
  request: { query: MeDocument },
  result: { data: { me: null } },
});

export const usersMock = (): MockedResponse => ({
  request: { query: UsersDocument },
  result: {
    data: {
      users: [
        ALICE,
        {
          __typename: "User",
          id: "bob",
          username: "bob",
          displayName: "Bob Nyström",
        },
      ],
    },
  },
});

export const fleetMock = (
  entries: {
    camera: CameraFieldsFragment;
    users: { id: string; displayName: string }[];
  }[],
): MockedResponse => ({
  request: { query: FleetDocument },
  result: {
    data: {
      cameras: entries.map(({ camera: c, users }) => ({
        ...c,
        users: users.map((u) => ({ __typename: "User", ...u })),
      })),
    },
  },
});
