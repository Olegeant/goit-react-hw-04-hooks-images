import { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import imageAPI from './utils/image-api.js';

import Searchbar from './components/Searchbar/Searchbar';
import ImageGallery from './components/ImageGallery/ImageGallery';
import Button from './components/Button/Button';
import Notification from './components/Notification/Notification';
import Loader from './components/Loader/Loader';
import Modal from './components/Modal/Modal';
import ScrollArrow from './components/ScrollArrow/ScrollArrow';

const Status = {
  IDLE: 'idle',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pagesDisplayed, setPagesDisplayed] = useState(1);
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(Status.IDLE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadBtnShown, setIsLoadBtnShown] = useState(false);

  useEffect(() => {
    const handleData = data => {
      return data.hits.map(({ id, webformatURL, largeImageURL, tags }) => ({
        id,
        webformatURL,
        largeImageURL,
        tags,
      }));
    };

    if (searchQuery === '') return;

    setStatus(Status.PENDING);
    setIsLoading(true);

    imageAPI
      .fetchImages(searchQuery, pagesDisplayed)
      .then(handleData)
      .then(newImages => {
        if (newImages.length === 0) {
          if (pagesDisplayed === 1) {
            toast.error('No images for this query. Try another search');
          } else {
            toast.error('No more images on Pixabay! You may add your images!');
          }

          setIsLoadBtnShown(false);
        } else {
          setIsLoadBtnShown(true);
        }

        setImages(images => [
          ...images,
          ...newImages.filter(
            image => !images.some(({ id }) => id === image.id),
          ),
        ]);
        setStatus(Status.RESOLVED);
        setIsLoading(false);

        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth',
        });
      })
      .catch(error => {
        toast.error(error.message);

        setError(error);
        setStatus(Status.REJECTED);
        setIsLoading(false);
      });
  }, [searchQuery, pagesDisplayed]);

  const toggleModal = useCallback(() => {
    setIsModalOpen(isModalOpen => !isModalOpen);
  }, []);

  const onImageClick = clickedImgId => {
    const clickedImage = images.find(image => {
      return clickedImgId === image.id;
    });

    setModalImage(clickedImage);

    toggleModal();
  };

  const addPage = () => {
    setPagesDisplayed(pagesDisplayed => pagesDisplayed + 1);
  };

  const handleFormSubmit = newQuery => {
    if (newQuery === searchQuery) {
      addPage();
      return;
    }

    setSearchQuery(newQuery);
    setImages([]);
    setPagesDisplayed(1);
  };

  return (
    <>
      <Searchbar onSubmit={handleFormSubmit} />

      {status === Status.IDLE && (
        <Notification type="info">
          No images yet. Please enter the query for search!
        </Notification>
      )}

      {status === Status.RESOLVED && images.length === 0 && (
        <Notification type="warning">No search results...</Notification>
      )}

      {status === Status.REJECTED && images.length === 0 && (
        <Notification type="error">
          ERROR OCCURRED! {error.message}
        </Notification>
      )}

      <ImageGallery images={images} onImgClick={onImageClick} />

      {isLoadBtnShown && (
        <Button onClick={addPage} loading={isLoading}>
          Load more...
        </Button>
      )}

      {<ToastContainer autoClose={3000} />}

      {isModalOpen && <Modal image={modalImage} onClose={toggleModal} />}

      {isLoading && (
        <Loader type="ThreeDots" color="#3f51b5" height={180} width={180} />
      )}

      <ScrollArrow type="down" />
      <ScrollArrow type="up" />
    </>
  );
};

export default App;
