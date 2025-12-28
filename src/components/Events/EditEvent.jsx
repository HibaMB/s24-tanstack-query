import { Link, useNavigate, useParams } from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchEvent, queryClient, updateEvent } from "../../utils/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const params = useParams();
  const id = params["id"];

  const {
    data: event,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["events", { id }],
    queryFn: ({ signal }) => fetchEvent({ id, signal }),
  });

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) => {
      const newEvent = data.event;

      await queryClient.cancelQueries({ queryKey: ["events", { id }] }); // to cancel any ongoing queries for this key

      const previousEvent = queryClient.getQueryData(["events", { id }]); // to be used for rollback in case mutation has failed

      queryClient.setQueryData(["events", { id }], newEvent);

      return { previousEvent };
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(["events", { id }], context.previousEvent);
    },
    onSettled: () => {
      //to make sure all queries in sync with BE, regardless failed or success
      queryClient.invalidateQueries(["events"]);
    },
    // onSuccess: () => {
    //   queryClient.invalidateQueries({
    //     queryKey: ["events"],
    //     refetchType: "none",
    //   });
    //   navigate("/events");
    // },
  });

  function handleSubmit(formData) {
    mutate({ id, event: formData });
    navigate("../");
  }

  function handleClose() {
    navigate("../");
  }

  return (
    <Modal onClose={handleClose}>
      {isPending && (
        <div className="center">
          <LoadingIndicator />
        </div>
      )}
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
          <button type="submit" className="button">
            Update
          </button>
        </EventForm>
      )}
    </Modal>
  );
}
