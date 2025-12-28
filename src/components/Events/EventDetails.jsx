import { Link, Outlet, useNavigate, useParams } from "react-router-dom";

import Header from "../Header.jsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { deleteEvent, fetchEvent, queryClient } from "../../utils/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import { useState } from "react";
import Modal from "../UI/Modal.jsx";

export default function EventDetails() {
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const params = useParams();
  const id = params["id"];

  const {
    data: event,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["events", { id }],
    queryFn: ({ signal }) => fetchEvent({ id, signal }),
  });

  const {
    mutate,
    isPending: isPendingDeletion,
    isError: isErrorDeleting,
    error: errorDeleting,
  } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["events"],
        refetchType: "none",
      });
      navigate("/events");
    },
  });

  function handleStartDelete() {
    setIsDeleting(true);
  }

  function handleStopDelete() {
    setIsDeleting(false);
  }

  function handleDelete() {
    mutate({ id });
  }

  if (isDeleting) {
    return (
      <Modal onClose={handleStopDelete}>
        <h2>Are you sure?</h2>
        <p>
          Do you really want to delete this event? This action cannot be undone.
        </p>
        <div className="form-actions">
          {isPendingDeletion && <p>Deleting, please wait...</p>}
          {!isPendingDeletion && (
            <>
              <button className="button-text" onClick={handleStopDelete}>
                Cancel
              </button>
              <button className="button" onClick={handleDelete}>
                Delete
              </button>
            </>
          )}
        </div>
        {isErrorDeleting && (
          <ErrorBlock
            title="Failed to delete event"
            message={
              errorDeleting.info?.message ||
              "Failed to delete event, please try again later."
            }
          />
        )}
      </Modal>
    );
  }

  return (
    <>
      <Outlet />
      <Header>
        <Link to="/events" className="nav-item">
          View all Events
        </Link>
      </Header>

      {isLoading && (
        <div id="event-details-content" className="center">
          <p>Fetching event details ..</p>
        </div>
      )}

      {isError && (
        <div id="event-details-content" className="center">
          <ErrorBlock
            title="An error occured"
            message={
              error.info?.message ||
              "Failed to fetch event details. Please try again later."
            }
          />
        </div>
      )}
      {event && (
        <article id="event-details">
          <header>
            <h1>{event.title}</h1>
            <nav>
              <button onClick={handleStartDelete}>Delete</button>
              <Link to="edit">Edit</Link>
            </nav>
          </header>
          <div id="event-details-content">
            <img
              src={`http://localhost:3000/${event.image}`}
              alt={event.title}
            />
            <div id="event-details-info">
              <div>
                <p id="event-details-location">{event.location}</p>
                <time dateTime={`Todo-DateT$Todo-Time`}>
                  {new Date(event.date).toLocaleString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  @ {event.time}
                </time>
              </div>
              <p id="event-details-description">{event.description}</p>
            </div>
          </div>
        </article>
      )}
    </>
  );
}
