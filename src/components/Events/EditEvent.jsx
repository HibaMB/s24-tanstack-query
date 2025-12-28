import {
  Link,
  redirect,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit,
} from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchEvent, queryClient, updateEvent } from "../../utils/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const submit = useSubmit();
  const { state } = useNavigation();

  const params = useParams();
  const id = params["id"];

  const {
    data: event,
    isError,
    error,
  } = useQuery({
    queryKey: ["events", { id }],
    queryFn: ({ signal }) => fetchEvent({ id, signal }),
    staleTime: 10000,
  });

  // const { mutate } = useMutation({
  //   mutationFn: updateEvent,
  //   onMutate: async (data) => {
  //     const newEvent = data.event;

  //     await queryClient.cancelQueries({ queryKey: ["events", { id }] }); // to cancel any ongoing queries for this key

  //     const previousEvent = queryClient.getQueryData(["events", { id }]); // to be used for rollback in case mutation has failed

  //     queryClient.setQueryData(["events", { id }], newEvent);

  //     return { previousEvent };
  //   },
  //   onError: (error, data, context) => {
  //     queryClient.setQueryData(["events", { id }], context.previousEvent);
  //   },
  //   onSettled: () => {
  //     //to make sure all queries in sync with BE, regardless failed or success
  //     queryClient.invalidateQueries(["events"]);
  //   },
  //   // onSuccess: () => {
  //   //   queryClient.invalidateQueries({
  //   //     queryKey: ["events"],
  //   //     refetchType: "none",
  //   //   });
  //   //   navigate("/events");
  //   // },
  // });

  function handleSubmit(formData) {
    // mutate({ id, event: formData });
    // navigate("../");

    submit(formData, { method: "PUT" });
  }

  function handleClose() {
    navigate("../");
  }

  return (
    <Modal onClose={handleClose}>
      {isError && (
        <>
          <ErrorBlock
            title="An error occured"
            message={
              error.info?.message ||
              "Failed to fetch event details. Please try again later."
            }
          />
          <div className="form-actions">
            <Link to="../" className="button">
              Okay
            </Link>
          </div>
        </>
      )}
      {event && (
        <EventForm inputData={event} onSubmit={handleSubmit}>
          <Link to="../" className="button-text">
            Cancel
          </Link>
          <button
            type="submit"
            className="button"
            disabled={state === "submitting"}
          >
            {state === "submitting" ? "Submitting..." : "Update"}
          </button>
        </EventForm>
      )}
    </Modal>
  );
}

export function loader({ params }) {
  return queryClient.fetchQuery({
    queryKey: ["events", { id: params.id }],
    queryFn: ({ signal }) => fetchEvent({ id: params.id, signal }),
  });
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const eventData = Object.fromEntries(formData);

  await updateEvent({ id: params.id, event: eventData });

  await queryClient.invalidateQueries({ queryKey: ["events"] });

  return redirect("../");
}
