package es.ucm.fdi.iw.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.SequenceGenerator;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;

/**
 * A message that users can send each other.
 *
 */
@Entity
@NamedQueries({
	@NamedQuery(name="Message.countUnread",
	query="SELECT COUNT(m) FROM Message m "
			+ "WHERE m.recipient.id = :userId AND m.dateRead = null")
})
@Data
public class Message implements Transferable<Message.Transfer> {
	
	private static Logger log = LogManager.getLogger(Message.class);	
	
	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gen")
	@SequenceGenerator(name = "gen", sequenceName = "gen")
	private long id;

	/*
	* ---------------
	*    Atributos
	* ---------------
	*/
	private String text;
	// Sera nuestro date
	private LocalDateTime dateSent;
	// Se borrara
	private LocalDateTime dateRead;

	/*
    !   Relaciones
    */
	@ManyToOne
	private User sender;
	// Se borrara recipient no tiene sentido, ya que lo sera el topic(chat) el que lo reciba
	@ManyToOne
	private User recipient;
	@ManyToOne
	private Topic topic;
  
	
	/**
	 * Objeto para persistir a/de JSON
	 * @author mfreire
	 */
    @Getter
    @AllArgsConstructor
	public static class Transfer {
		private String from;
		private String to;
		// Sera el Date
		private String sent;
		// Se borrara
		private String received;
		// Es el chat al que pertenece
    	private String topic;
		private String text;
		long id;
		
		public Transfer(Message m) {
			this.from = m.getSender().getUsername();
			this.to = m.getRecipient() == null ? "null": m.getRecipient().getUsername();
			this.topic = m.getTopic() == null ? "null": m.getTopic().getName();
			this.sent = DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(m.getDateSent());
			this.received = m.getDateRead() == null ?
					null : DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(m.getDateRead());
			this.text = m.getText();
			this.id = m.getId();
		}
	}

	@Override
	public Transfer toTransfer() {
		return new Transfer(this);
    }
}
