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
	@NamedQuery(name="Message.msgPorTopic",
	query="SELECT m FROM Message m "
		 + "WHERE m.topic.key = :room ORDER BY m.dateSent ASC"),

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

	/*
    !   Relaciones
    */
	@ManyToOne
	private User sender;

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
		// Sera el Date
		private String sent;
		// Es el chat al que pertenece
    	private String topic;
		private String text;
		long id;
		
		public Transfer(Message m) {
			this.from = m.getSender().getUsername();
			this.topic = m.getTopic() == null ? "null": m.getTopic().getName();
			this.sent = DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(m.getDateSent());
			this.text = m.getText();
			this.id = m.getId();
		}
	}

	@Override
	public Transfer toTransfer() {
		return new Transfer(this);
    }
}
