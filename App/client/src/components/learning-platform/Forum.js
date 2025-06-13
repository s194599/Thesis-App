import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Image, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import { BsPersonCircle, BsReply, BsArrowReturnRight, BsTrash, BsExclamationCircle, BsImage, BsX, BsToggleOn, BsToggleOff } from 'react-icons/bs';
import { getForumPosts, createForumPost, addForumComment, deleteForumPost, toggleForumStatus } from '../../services/api';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

// Using open source images from UI Faces and Unsplash for avatars
const DEFAULT_PROFILE_PICTURE = 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=250&h=250&fit=crop';

const USER_PROFILES = {
  student: {
    name: 'Christian Wu',
    profilePictureUrl: 'https://randomuser.me/api/portraits/men/18.jpg'
  },
  teacher: {
    name: 'Carsten Blachmann',
    profilePictureUrl: 'https://randomuser.me/api/portraits/men/76.jpg'
  }
};

const Forum = ({ moduleId, userRole }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [replyingToPostId, setReplyingToPostId] = useState(null);
  const [isForumEnabled, setIsForumEnabled] = useState(true);
  const [forumStatusLoading, setForumStatusLoading] = useState(false);
  
  // State for new post form
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState('');
  
  // State for new comment form
  const [newCommentBody, setNewCommentBody] = useState('');
  const [newCommentImage, setNewCommentImage] = useState(null);
  const [newCommentImagePreview, setNewCommentImagePreview] = useState('');
  
  // File input refs
  const postImageInputRef = useRef(null);
  const commentImageInputRef = useRef(null);
  
  // Get current user info based on role
  const currentUser = USER_PROFILES[userRole] || USER_PROFILES.student;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch forum posts when the component mounts or moduleId changes
  useEffect(() => {
    const fetchPosts = async () => {
      if (!moduleId) return;
      
      setLoading(true);
      try {
        const response = await getForumPosts(moduleId);
        
        // Check if response includes forum status
        if (response.forumStatus !== undefined) {
          setIsForumEnabled(response.forumStatus === 'enabled');
        }
        
        const fetchedPosts = response.posts || response; // Handle both formats
        
        // Sort posts by timestamp (newest first)
        const sortedPosts = fetchedPosts.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        setPosts(sortedPosts);
        setError(null);
      } catch (err) {
        console.error('Error fetching forum posts:', err);
        setError('Der opstod en fejl ved hentning af forumindlæg. Prøv igen senere.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [moduleId]);
  
  // Handle image file selection for post
  const handlePostImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Billedet er for stort. Maksimal størrelse er 5MB.');
        return;
      }
      
      setNewPostImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle image file selection for comment
  const handleCommentImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Billedet er for stort. Maksimal størrelse er 5MB.');
        return;
      }
      
      setNewCommentImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCommentImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Remove post image
  const removePostImage = () => {
    setNewPostImage(null);
    setNewPostImagePreview('');
    if (postImageInputRef.current) {
      postImageInputRef.current.value = '';
    }
  };
  
  // Remove comment image
  const removeCommentImage = () => {
    setNewCommentImage(null);
    setNewCommentImagePreview('');
    if (commentImageInputRef.current) {
      commentImageInputRef.current.value = '';
    }
  };

  // Handle creating a new post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPostTitle.trim() || !newPostBody.trim()) {
      setError('Både titel og indhold er påkrævet.');
      return;
    }
    
    try {
      const postData = {
        authorName: currentUser.name,
        postTitle: newPostTitle,
        bodyText: newPostBody,
        profilePictureUrl: currentUser.profilePictureUrl || DEFAULT_PROFILE_PICTURE
      };
      
      // If we have an image, add it to the post data
      if (newPostImagePreview) {
        postData.imageAttachment = newPostImagePreview;
      }
      
      const newPost = await createForumPost(moduleId, postData);
      
      // Add the new post to the posts list
      setPosts([newPost, ...posts]);
      
      // Reset form
      setNewPostTitle('');
      setNewPostBody('');
      setNewPostImage(null);
      setNewPostImagePreview('');
      setShowNewPostForm(false);
      setError(null);
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Der opstod en fejl ved oprettelse af indlægget. Prøv igen senere.');
    }
  };

  // Handle adding a comment to a post
  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    
    if (!newCommentBody.trim()) {
      setError('Kommentartekst er påkrævet.');
      return;
    }
    
    try {
      const commentData = {
        authorName: currentUser.name,
        bodyText: newCommentBody,
        profilePictureUrl: currentUser.profilePictureUrl || DEFAULT_PROFILE_PICTURE
      };
      
      // If we have an image, add it to the comment data
      if (newCommentImagePreview) {
        commentData.imageAttachment = newCommentImagePreview;
      }
      
      const newComment = await addForumComment(moduleId, postId, commentData);
      
      // Update the post with the new comment
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const updatedPost = { ...post };
          updatedPost.comments = [...(updatedPost.comments || []), newComment];
          return updatedPost;
        }
        return post;
      }));
      
      // Reset form
      setNewCommentBody('');
      setNewCommentImage(null);
      setNewCommentImagePreview('');
      setReplyingToPostId(null);
      setError(null);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Der opstod en fejl ved tilføjelse af kommentaren. Prøv igen senere.');
    }
  };

  // Format timestamp to show actual date and time
  const formatTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: da });
    } catch (err) {
      console.error('Error formatting timestamp:', err);
      return 'Ukendt tidspunkt';
    }
  };

  // Handle deleting a post
  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    setDeleteLoading(true);
    try {
      await deleteForumPost(moduleId, postToDelete);
      
      // Remove the post from the state
      setPosts(posts.filter(post => post.id !== postToDelete));
      setError(null);
      
      // Close the modal
      setShowDeleteModal(false);
      setPostToDelete(null);
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Der opstod en fejl ved sletning af indlægget. Prøv igen senere.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle toggling forum status globally (enabled/disabled)
  const handleToggleForumStatus = async () => {
    setForumStatusLoading(true);
    try {
      const newStatus = !isForumEnabled ? 'enabled' : 'disabled';
      await toggleForumStatus('global', newStatus); // Use 'global' to indicate this affects all forums
      setIsForumEnabled(!isForumEnabled);
      setError(null);
    } catch (err) {
      console.error('Error toggling forum status:', err);
      setError(`Der opstod en fejl ved ${isForumEnabled ? 'deaktivering' : 'aktivering'} af forum-funktionen. Prøv igen senere.`);
    } finally {
      setForumStatusLoading(false);
    }
  };

  // Show delete confirmation modal
  const confirmDelete = (postId) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Indlæser forum...</p>
      </div>
    );
  }

  return (
    <div className="forum-container">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {/* Forum header with title and teacher controls */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Forum</h3>
        
        {/* Teacher controls for global forum status */}
        {userRole === 'teacher' && (
          <div>
            <Button
              variant={isForumEnabled ? "outline-danger" : "outline-success"}
              onClick={handleToggleForumStatus}
              disabled={forumStatusLoading}
              className="d-flex align-items-center"
            >
              {forumStatusLoading ? (
                <Spinner size="sm" animation="border" className="me-2" />
              ) : isForumEnabled ? (
                <BsToggleOn size={20} className="me-2" />
              ) : (
                <BsToggleOff size={20} className="me-2" />
              )}
              {isForumEnabled ? "Deaktivér alle forum" : "Aktivér alle forum"}
            </Button>
          </div>
        )}
      </div>
      
      {/* Disabled Forum Message */}
      {!isForumEnabled && (
        <Alert variant="info" className="mb-4">
          <div className="d-flex align-items-center">
            {/* <BsToggleOff size={24} className="text-secondary me-3" /> */}
            <div>
              <h5 className="mb-1">Forum er deaktiveret</h5>
              <p className="mb-0">Underviseren har deaktiveret forum-funktionen for hele platformen.</p>
              {/* {userRole === 'teacher' && (
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleToggleForumStatus}
                  disabled={forumStatusLoading}
                >
                  {forumStatusLoading ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-1" />
                      Aktiverer...
                    </>
                  ) : (
                    "Aktivér alle forum"
                  )}
                </Button>
              )} */}
            </div>
          </div>
        </Alert>
      )}

      {/* New Post Form */}
      {showNewPostForm && isForumEnabled && (
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Opret nyt indlæg</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleCreatePost}>
              <Form.Group className="mb-3">
                <Form.Label>Titel</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Indtast indlæggets titel"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Indhold</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Skriv dit indlæg her..."
                  value={newPostBody}
                  onChange={(e) => setNewPostBody(e.target.value)}
                  required
                />
              </Form.Group>
              
              {/* Image attachment for post */}
              <Form.Group className="mb-3">
                <Form.Label>Vedhæft billede (valgfrit)</Form.Label>
                <div className="d-flex align-items-center">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => postImageInputRef.current.click()}
                    className="me-2"
                  >
                    <BsImage className="me-1" /> Vælg billede
                  </Button>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handlePostImageChange}
                    className="d-none"
                    ref={postImageInputRef}
                  />
                  <small className="text-muted">Max 5MB</small>
                </div>
                
                {newPostImagePreview && (
                  <div className="position-relative mt-3" style={{ maxWidth: '300px' }}>
                    <Image src={newPostImagePreview} fluid thumbnail />
                    <Button 
                      variant="danger" 
                      size="sm" 
                      className="position-absolute top-0 end-0 m-1 p-1" 
                      onClick={removePostImage}
                    >
                      <BsX />
                    </Button>
                  </div>
                )}
              </Form.Group>
              
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setShowNewPostForm(false)}>
                  Annuller
                </Button>
                <Button variant="primary" type="submit">
                  Opret indlæg
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
      
      {/* Forum Posts */}
      {isForumEnabled && posts.length > 0 ? (
        posts.map(post => (
          <Card className="mb-4 forum-post" key={post.id}>
            <Card.Header className="bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <Image 
                    src={post.profilePictureUrl || DEFAULT_PROFILE_PICTURE} 
                    roundedCircle 
                    width={40} 
                    height={40}
                    className="me-2"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_PROFILE_PICTURE;
                    }}
                  />
                  <div>
                    <h5 className="mb-0">{post.postTitle}</h5>
                    <div className="d-flex align-items-center">
                      <span className="text-muted small">{post.authorName}</span>
                      <span className="mx-1 text-muted">•</span>
                      <span className="text-muted small">{formatTimestamp(post.timestamp)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Delete button - Only visible for teachers */}
                {userRole === 'teacher' && (
                  <Button 
                    variant="link" 
                    className="p-0 text-danger" 
                    onClick={() => confirmDelete(post.id)}
                    title="Slet indlæg"
                  >
                    <BsTrash />
                  </Button>
                )}
              </div>
            </Card.Header>
            
            <Card.Body>
              <p className="post-body">{post.bodyText}</p>
              
              {/* Display post image if available */}
              {post.imageAttachment && (
                <div className="post-image-container mb-3">
                  <Image 
                    src={post.imageAttachment} 
                    fluid 
                    thumbnail 
                    style={{ maxWidth: '300px' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <Button 
                variant="link" 
                className="p-0 text-decoration-none" 
                onClick={() => setReplyingToPostId(replyingToPostId === post.id ? null : post.id)}
              >
                <BsReply className="me-1" />
                {replyingToPostId === post.id ? "Annuller svar" : "Svar"}
              </Button>
              
              {/* Comments Section */}
              {post.comments && post.comments.length > 0 && (
                <div className="comments-section mt-3">
                  <h6 className="text-muted mb-2">
                    <Badge bg="light" text="dark" className="px-2 py-1">
                      {post.comments.length} {post.comments.length === 1 ? 'kommentar' : 'kommentarer'}
                    </Badge>
                  </h6>
                  
                  {post.comments.map(comment => (
                    <Card className="comment-card mb-2" key={comment.id}>
                      <Card.Body className="py-2 px-3">
                        <div className="d-flex">
                          <div className="me-2">
                            <BsArrowReturnRight className="text-muted" />
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              <Image 
                                src={comment.profilePictureUrl || DEFAULT_PROFILE_PICTURE} 
                                roundedCircle 
                                width={28} 
                                height={28}
                                className="me-2"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = DEFAULT_PROFILE_PICTURE;
                                }}
                              />
                              <span className="fw-medium">{comment.authorName}</span>
                              <span className="mx-1 text-muted">•</span>
                              <span className="text-muted small">{formatTimestamp(comment.timestamp)}</span>
                            </div>
                            <p className="mb-1">{comment.bodyText}</p>
                            
                            {/* Display comment image if available */}
                            {comment.imageAttachment && (
                              <div className="comment-image-container mb-1">
                                <Image 
                                  src={comment.imageAttachment} 
                                  fluid 
                                  thumbnail 
                                  style={{ maxWidth: '200px' }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Reply Form */}
              {replyingToPostId === post.id && (
                <Form className="mt-3" onSubmit={(e) => handleAddComment(e, post.id)}>
                  <Form.Group className="mb-2">
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Skriv en kommentar..."
                      value={newCommentBody}
                      onChange={(e) => setNewCommentBody(e.target.value)}
                      required
                    />
                  </Form.Group>
                  
                  {/* Image attachment for comment */}
                  <Form.Group className="mb-2">
                    <div className="d-flex align-items-center">
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => commentImageInputRef.current.click()}
                        className="me-2"
                      >
                        <BsImage /> Vedhæft billede
                      </Button>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleCommentImageChange}
                        className="d-none"
                        ref={commentImageInputRef}
                      />
                    </div>
                    
                    {newCommentImagePreview && (
                      <div className="position-relative mt-2" style={{ maxWidth: '200px' }}>
                        <Image src={newCommentImagePreview} fluid thumbnail />
                        <Button 
                          variant="danger" 
                          size="sm" 
                          className="position-absolute top-0 end-0 m-1 p-1" 
                          onClick={removeCommentImage}
                        >
                          <BsX />
                        </Button>
                      </div>
                    )}
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end mt-2">
                    <Button variant="primary" type="submit" size="sm">
                      Send kommentar
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        ))
      ) : isForumEnabled ? (
        <div className="text-center my-5 py-5 bg-light rounded">
          <BsPersonCircle size={40} className="text-secondary mb-3" />
          <h5>Ingen indlæg endnu</h5>
          <p className="text-muted">Vær den første til at starte en samtale!</p>
          <Button variant="primary" onClick={() => setShowNewPostForm(true)}>
            Opret nyt indlæg
          </Button>
        </div>
      ) : null}
      
      {/* Create new post button - now positioned at the bottom (only when there are posts and forum is enabled) */}
      {!showNewPostForm && isForumEnabled && posts.length > 0 && (
        <div className="mb-4 mt-4">
          <Button 
            variant="primary"
            onClick={() => setShowNewPostForm(true)}
          >
            Opret nyt indlæg
          </Button>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Bekræft sletning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <BsExclamationCircle size={48} className="text-warning mb-3" />
            <p>Er du sikker på, at du vil slette dette indlæg? Denne handling kan ikke fortrydes.</p>
            <p className="text-muted small">Alle kommentarer til dette indlæg vil også blive slettet.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuller
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeletePost}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Sletter...
              </>
            ) : (
              'Slet indlæg'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Forum; 